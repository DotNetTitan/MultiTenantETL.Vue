import { ref } from 'vue';

export function useTransformation() {
  const error = ref(null);
  
  const validateTransformation = (transformation, inputSchema) => {
    const errors = [];
    
    switch (transformation.type) {
      case 'Filter':
        if (!transformation.config.filterColumn) {
          errors.push('Filter column is required');
        }
        if (!transformation.config.operator) {
          errors.push('Operator is required');
        }
        if (!['isEmpty', 'isNotEmpty'].includes(transformation.config.operator) && 
            !transformation.config.value) {
          errors.push('Filter value is required');
        }
        // Validate column exists in schema
        if (inputSchema && !inputSchema.columns.find(c => c.name === transformation.config.filterColumn)) {
          errors.push(`Column '${transformation.config.filterColumn}' not found in input schema`);
        }
        break;

      case 'Map':
        if (!transformation.config.sourceColumn) {
          errors.push('Source column is required');
        }
        if (!transformation.config.mappings || transformation.config.mappings.length === 0) {
          errors.push('At least one mapping is required');
        }
        // Validate source column exists
        if (inputSchema && !inputSchema.columns.find(c => c.name === transformation.config.sourceColumn)) {
          errors.push(`Column '${transformation.config.sourceColumn}' not found in input schema`);
        }
        break;

      case 'Aggregation':
        if (!transformation.config.groupByColumns || transformation.config.groupByColumns.length === 0) {
          errors.push('At least one group by column is required');
        }
        if (!transformation.config.aggregationType) {
          errors.push('Aggregation type is required');
        }
        if (transformation.config.aggregationType !== 'count' && !transformation.config.aggregationColumn) {
          errors.push('Aggregation column is required');
        }
        // Validate columns exist
        if (inputSchema) {
          transformation.config.groupByColumns.forEach(col => {
            if (!inputSchema.columns.find(c => c.name === col)) {
              errors.push(`Group by column '${col}' not found in input schema`);
            }
          });
          if (transformation.config.aggregationColumn &&
              !inputSchema.columns.find(c => c.name === transformation.config.aggregationColumn)) {
            errors.push(`Aggregation column '${transformation.config.aggregationColumn}' not found in input schema`);
          }
        }
        break;

      case 'Script':
        if (!transformation.config.script) {
          errors.push('Script is required');
        }
        try {
          // Basic syntax check for JavaScript
          new Function(transformation.config.script);
        } catch (e) {
          errors.push(`Script syntax error: ${e.message}`);
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const getOutputSchema = (transformation, inputSchema) => {
    if (!inputSchema) return null;

    switch (transformation.type) {
      case 'Filter':
        // Filter doesn't change schema
        return inputSchema;

      case 'Map':
        return {
          ...inputSchema,
          columns: inputSchema.columns.map(col => {
            if (col.name === transformation.config.sourceColumn && transformation.config.targetColumn) {
              return {
                name: transformation.config.targetColumn,
                type: col.type,
                nullable: col.nullable
              };
            }
            return col;
          })
        };

      case 'Aggregation':
        return {
          columns: [
            ...transformation.config.groupByColumns.map(colName => {
              const originalCol = inputSchema.columns.find(c => c.name === colName);
              return {
                name: colName,
                type: originalCol?.type || 'unknown',
                nullable: false
              };
            }),
            {
              name: transformation.config.resultColumn,
              type: getAggregationResultType(
                transformation.config.aggregationType,
                transformation.config.aggregationColumn 
                  ? inputSchema.columns.find(c => c.name === transformation.config.aggregationColumn)?.type
                  : null
              ),
              nullable: false
            }
          ]
        };

      case 'Script':
        // Can't determine schema for custom scripts
        return {
          columns: [
            ...inputSchema.columns,
            {
              name: '(custom)',
              type: 'unknown',
              nullable: true
            }
          ]
        };
    }
  };

  const getAggregationResultType = (aggType, inputType) => {
    switch (aggType) {
      case 'count':
        return 'int';
      case 'sum':
      case 'avg':
        return inputType?.includes('int') ? 'decimal' : inputType;
      case 'min':
      case 'max':
        return inputType;
      default:
        return 'unknown';
    }
  };

  return {
    error,
    validateTransformation,
    getOutputSchema
  };
}