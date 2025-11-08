import { ref } from 'vue';
import { usePipeline } from './usePipeline'; // To get createEmptyPipeline
import { fetchDataSources as getDataSources } from '@/services/dataSourceService';

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
  const showTransformationSelector = ref(false);
  const editedPipeline = ref(createEmptyPipeline());
  const form = ref(null); // Ref for the main pipeline form
  const timezones = ref(timezonesList); // Make timezones available to components

  // Function to fetch data sources
  async function fetchDataSources() {
    try {
      dataSources.value = await getDataSources();
    } catch (error) {
      console.error('Error fetching data sources:', error);
    }
  }

  // Extend createEmptyPipeline to include timezone in schedule and field mappings
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
    // Ensure fieldMappings array exists
    if (!pipeline.fieldMappings) {
      pipeline.fieldMappings = [];
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
      fieldMappings: JSON.parse(JSON.stringify(pipeline.fieldMappings || [])), // Deep clone field mappings
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
    // NEW: Open selector instead of creation dialog
    showTransformationSelector.value = true;
  }

  function selectExistingTransformation(transformation) {
    // Add the selected transformation to the pipeline
    editedPipeline.value.transformations.push({
      ...transformation,
      executionOrder: editedPipeline.value.transformations.length + 1
    });
    showTransformationSelector.value = false;
  }

  function removeTransformation(index) {
    editedPipeline.value.transformations.splice(index, 1);
    // Update execution order for remaining transformations
    editedPipeline.value.transformations.forEach((t, i) => {
      t.executionOrder = i + 1;
    });
  }

  return {
    // State
    form,
    editedPipeline,
    dataSources,
    showTransformationSelector,
    timezones,

    // Methods
    fetchDataSources,
    prepareEditPipeline,
    resetForm,
    addTransformation,
    selectExistingTransformation,
    removeTransformation,
  };
}
