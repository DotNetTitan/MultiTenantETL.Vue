import { ref } from 'vue';
import { usePipeline } from './usePipeline'; // To get createEmptyPipeline

// TODO: Ideally, dataSources should come from a dedicated useDataSource composable
const mockDataSources = [
  { id: '1', name: 'SQL Server - Sales', type: 'Database' },
  { id: '2', name: 'SFTP - Customer Files', type: 'File' },
  { id: '3', name: 'ERP API', type: 'API' },
  { id: '4', name: 'Analytics DB', type: 'Database' },
  { id: '5', name: 'Data Warehouse', type: 'Database' },
  { id: '6', name: 'Customer Database', type: 'Database' },
  { id: '7', name: 'E-commerce Platform', type: 'API' },
  { id: '8', name: 'Reporting System', type: 'API' }
];

// Common timezones list
const timezonesList = [
  { value: 'UTC', name: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', name: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', name: 'Central Time (US & Canada)' },
  { value: 'America/Denver', name: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', name: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', name: 'London (GMT)' },
  { value: 'Europe/Paris', name: 'Paris (Central European Time)' },
  { value: 'Asia/Tokyo', name: 'Tokyo (Japan Standard Time)' },
  { value: 'Asia/Shanghai', name: 'China Standard Time' },
  { value: 'Australia/Sydney', name: 'Sydney (Australian Eastern Time)' }
];

export function usePipelineForm() {
  const { createEmptyPipeline } = usePipeline(); // Get helper from main composable

  // State moved from PipelinesView
  const dataSources = ref([]);
  const transformationTypes = ref(['Filter', 'Map', 'Join', 'Aggregate', 'Enrich', 'Custom']);
  const showTransformationDialog = ref(false);
  const transformationForm = ref(null); // Ref for the transformation sub-dialog form
  const editedPipeline = ref(createEmptyPipeline());
  const editedTransformation = ref({
    name: '',
    type: 'Filter',
    executionOrder: 1,
    configuration: '{}'
  });
  const editedTransformationIndex = ref(-1);
  const form = ref(null); // Ref for the main pipeline form
  const timezones = ref(timezonesList); // Make timezones available to components

  // Function to fetch data sources (currently mock)
  // TODO: Replace with actual service call, likely via useDataSource composable
  function fetchDataSources() {
    try {
      // Simulate API call
      setTimeout(() => {
        dataSources.value = mockDataSources;
      }, 300);
    } catch (error) {
      console.error('Error fetching data sources:', error);
    }
  }

  // Extend createEmptyPipeline to include timezone in schedule
  function getEmptyPipeline() {
    const pipeline = createEmptyPipeline();
    if (pipeline.schedule) {
      pipeline.schedule.timezone = 'UTC'; // Default to UTC
    } else {
      pipeline.schedule = {
        frequency: 'Daily',
        time: '00:00',
        cronExpression: '0 0 * * *',
        timezone: 'UTC'
      };
    }
    return pipeline;
  }

  // Function to prepare the form for editing an existing pipeline
  function prepareEditPipeline(pipeline) {
    // Clone the pipeline to avoid modifying the original directly
    // Need to find the full source/destination objects from the fetched dataSources
    const source = dataSources.value.find(ds => ds.id === pipeline.sourceId || ds.name === pipeline.sourceName) || null;
    const destination = dataSources.value.find(ds => ds.id === pipeline.destinationId || ds.name === pipeline.destinationName) || null;

    editedPipeline.value = {
      id: pipeline.id,
      name: pipeline.name,
      description: pipeline.description,
      // Store the full object or just the ID depending on how v-select is configured
      // Assuming v-select uses item-value="id" and returns the object
      sourceId: source,
      destinationId: destination,
      transformations: JSON.parse(JSON.stringify(pipeline.transformations || [])), // Deep clone transformations
      isScheduled: pipeline.isScheduled,
      schedule: pipeline.schedule ? { 
        ...pipeline.schedule,
        // Ensure timezone exists, default to UTC if not present
        timezone: pipeline.schedule.timezone || 'UTC' 
      } : {
        frequency: 'Daily',
        time: '00:00',
        cronExpression: '0 0 * * *',
        timezone: 'UTC' 
      }
    };
  }

  // Function to reset the form to a blank state for creating a new pipeline
  function resetForm() {
    editedPipeline.value = getEmptyPipeline();
    if (form.value) {
      form.value.resetValidation(); // Reset Vuetify form validation if needed
    }
  }

  // --- Transformation Management ---

  function addTransformation() {
    editedTransformation.value = {
      name: '',
      type: 'Filter',
      executionOrder: editedPipeline.value.transformations.length + 1,
      configuration: '{}' // Default or based on type
    };
    editedTransformationIndex.value = -1;
    showTransformationDialog.value = true;
    if (transformationForm.value) {
      transformationForm.value.resetValidation();
    }
  }

  function editTransformation(index) {
    const transformation = editedPipeline.value.transformations[index];
    editedTransformation.value = { ...transformation }; // Clone
    editedTransformationIndex.value = index;
    showTransformationDialog.value = true;
    if (transformationForm.value) {
      transformationForm.value.resetValidation();
    }
  }

  function removeTransformation(index) {
    editedPipeline.value.transformations.splice(index, 1);
    // Update execution order for remaining transformations
    editedPipeline.value.transformations.forEach((t, i) => {
      t.executionOrder = i + 1;
    });
  }

  async function saveTransformation() {
    // Basic validation example (assuming transformationForm is a v-form ref)
    if (transformationForm.value) {
      const { valid } = await transformationForm.value.validate();
      if (!valid) return;
    }

    if (editedTransformationIndex.value === -1) {
      // Add new transformation
      editedPipeline.value.transformations.push({ ...editedTransformation.value });
    } else {
      // Update existing transformation
      editedPipeline.value.transformations[editedTransformationIndex.value] = { ...editedTransformation.value };
    }

    // Sort transformations by execution order
    editedPipeline.value.transformations.sort((a, b) => a.executionOrder - b.executionOrder);

    showTransformationDialog.value = false;
  }

  return {
    // State
    form, // Main form ref
    editedPipeline,
    dataSources,
    transformationTypes,
    showTransformationDialog,
    transformationForm, // Transformation dialog form ref
    editedTransformation,
    editedTransformationIndex,
    timezones, // Make timezones available to components

    // Methods
    fetchDataSources,
    prepareEditPipeline,
    resetForm,
    addTransformation,
    editTransformation,
    removeTransformation,
    saveTransformation,
  };
}
