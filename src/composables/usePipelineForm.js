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
      schedule: pipeline.schedule ? { ...pipeline.schedule } : {
        frequency: 'Daily',
        time: '00:00',
        cronExpression: '0 0 * * *'
      }
    };
  }

  // Function to reset the form to a blank state for creating a new pipeline
  function resetForm() {
    editedPipeline.value = createEmptyPipeline();
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
