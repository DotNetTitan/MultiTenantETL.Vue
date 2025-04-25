import { ref } from 'vue';
import { useTransformation } from './useTransformation';
import { useDataSource } from './useDataSource';

export function usePipeline() {
  const { validateTransformation, getOutputSchema } = useTransformation();
  const { detectSchema } = useDataSource();
  
  const error = ref(null);

  // Validate entire pipeline including data flow and dependencies
  const validatePipeline = async (pipeline) => {
    const errors = [];
    
    if (!pipeline.sourceId) {
      errors.push('Source is required');
    }
    if (!pipeline.destinationId) {
      errors.push('Destination is required');
    }

    // Validate transformations chain
    try {
      const sourceSchema = await detectSchema(pipeline.sourceId);
      let currentSchema = sourceSchema;

      for (const transformation of pipeline.transformations) {
        // Validate individual transformation
        const validationResult = validateTransformation(transformation, currentSchema);
        if (!validationResult.isValid) {
          errors.push(...validationResult.errors.map(err => 
            `Transformation "${transformation.name}": ${err}`
          ));
        }

        // Update schema for next transformation
        currentSchema = getOutputSchema(transformation, currentSchema);
      }

      // Validate final schema matches destination requirements
      const destinationSchema = await detectSchema(pipeline.destinationId);
      if (destinationSchema) {
        validateSchemaCompatibility(currentSchema, destinationSchema, errors);
      }
    } catch (err) {
      errors.push(`Schema validation error: ${err.message}`);
    }

    // Validate schedule if enabled
    if (pipeline.isScheduled) {
      validateSchedule(pipeline.schedule, errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Validate schema compatibility between source and destination
  const validateSchemaCompatibility = (sourceSchema, destSchema, errors) => {
    destSchema.columns.forEach(destCol => {
      const sourceCol = sourceSchema.columns.find(c => c.name === destCol.name);
      
      if (!sourceCol && !destCol.nullable) {
        errors.push(`Required destination column '${destCol.name}' is missing from pipeline output`);
      } else if (sourceCol && !isCompatibleType(sourceCol.type, destCol.type)) {
        errors.push(
          `Type mismatch for column '${destCol.name}': ` +
          `expected ${destCol.type}, got ${sourceCol.type}`
        );
      }
    });
  };

  // Check if data types are compatible
  const isCompatibleType = (sourceType, destType) => {
    // Define type compatibility rules
    const compatibility = {
      'int': ['int', 'decimal', 'varchar', 'nvarchar'],
      'decimal': ['decimal', 'varchar', 'nvarchar'],
      'varchar': ['varchar', 'nvarchar', 'text'],
      'nvarchar': ['nvarchar', 'text'],
      'datetime': ['datetime', 'varchar', 'nvarchar'],
      'boolean': ['boolean', 'int', 'varchar', 'nvarchar']
    };

    return compatibility[sourceType]?.includes(destType) || sourceType === destType;
  };

  // Validate schedule configuration
  const validateSchedule = (schedule, errors) => {
    if (!schedule.frequency) {
      errors.push('Schedule frequency is required');
    }
    if (!schedule.time) {
      errors.push('Schedule time is required');
    }
    if (schedule.frequency === 'Custom' && !schedule.cronExpression) {
      errors.push('Cron expression is required for custom schedule');
    }
  };

  // Get pipeline dependencies
  const getDependencies = (pipelines) => {
    const dependencies = new Map();

    pipelines.forEach(pipeline => {
      const deps = [];

      // Check for shared data sources
      pipelines.forEach(otherPipeline => {
        if (otherPipeline.id === pipeline.id) return;

        if (otherPipeline.destinationId === pipeline.sourceId) {
          deps.push({
            id: otherPipeline.id,
            name: otherPipeline.name,
            type: 'source'
          });
        }
      });

      dependencies.set(pipeline.id, deps);
    });

    return dependencies;
  };

  // Calculate optimal execution order for multiple pipelines
  const getExecutionOrder = (pipelines) => {
    const dependencies = getDependencies(pipelines);
    const visited = new Set();
    const order = [];

    const visit = (pipelineId) => {
      if (visited.has(pipelineId)) return;
      visited.add(pipelineId);

      dependencies.get(pipelineId)?.forEach(dep => {
        visit(dep.id);
      });

      order.push(pipelineId);
    };

    pipelines.forEach(pipeline => {
      if (!visited.has(pipeline.id)) {
        visit(pipeline.id);
      }
    });

    return order;
  };

  // Define error handling strategies
  const errorStrategies = {
    STOP: 'stop',             // Stop pipeline execution on error
    CONTINUE: 'continue',     // Continue with next transformation
    RETRY: 'retry',           // Retry the failed transformation
    SKIP: 'skip'             // Skip records that cause errors
  };

  return {
    error,
    validatePipeline,
    getDependencies,
    getExecutionOrder,
    errorStrategies
  };
}