<template>
  <v-card class="wizard-card" elevation="0">
    <v-stepper v-model="currentStep" alt-labels flat class="wizard-stepper">
      <v-stepper-header>
        <v-stepper-item
          :complete="currentStep > 1"
          :value="1"
          :title="t('common.basicInfo')"
          :subtitle="t('common.typeAndProvider')"
        />
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <v-stepper-item
          :complete="currentStep > 2"
          :value="2"
          :title="t('common.connection')"
          :subtitle="t('common.connectionDetails')"
        />
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <v-stepper-item
          :complete="currentStep > 3"
          :value="3"
          :title="t('common.schema')"
          :subtitle="t('common.defineDataStructure')"
        />
        <v-icon v-if="showWriteConfigStep" class="step-arrow">mdi-chevron-right</v-icon>
        <v-stepper-item
          v-if="showWriteConfigStep"
          :complete="currentStep > 4"
          :value="4"
          :title="t('common.writeConfig')"
          :subtitle="t('common.destinationSettings')"
        />
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <v-stepper-item
          :value="showWriteConfigStep ? 5 : 4"
          :title="t('common.reviewAndSave')"
          :subtitle="t('common.reviewConfiguration')"
        />
      </v-stepper-header>

      <v-stepper-window class="stepper-window">
        <!-- Step 1: Basic Info -->
        <v-stepper-window-item :value="1">
          <div class="pa-6">
            <div class="text-h5 mb-4">{{ t('dataSources.dataSourceName') }}</div>
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="dataSource.name"
                  :label="t('dataSources.dataSourceName')"
                  :placeholder="t('dataSources.namePlaceholder')"
                  variant="outlined"
                  :rules="[v => !!v || t('validation.required', { field: t('common.name') })]"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="dataSource.description"
                  :label="t('common.description')"
                  :placeholder="t('dataSources.descriptionPlaceholder')"
                  variant="outlined"
                  rows="2"
                  auto-grow
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="dataSource.type"
                  :items="dataSourceTypes"
                  :label="t('dataSources.type')"
                  variant="outlined"
                  :rules="[v => !!v || t('validation.required', { field: t('dataSources.type') })]"
                  required
                  @update:model-value="handleTypeChange"
                >
                  <template #item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-icon>{{ getTypeIcon(item.value) }}</v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="dataSource.provider"
                  :items="providerOptions"
                  :label="t('dataSources.provider')"
                  variant="outlined"
                  :rules="[v => !!v || t('validation.required', { field: t('dataSources.provider') })]"
                  required
                  :disabled="!dataSource.type"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="dataSource.direction"
                  :items="directionOptions"
                  :label="t('dataSources.direction')"
                  variant="outlined"
                  :rules="[v => !!v || t('validation.required', { field: t('dataSources.direction') })]"
                  required
                  :hint="t('common.howDataSourceUsed')"
                  persistent-hint
                >
                  <template #item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-icon>{{ item.raw.icon }}</v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </div>
        </v-stepper-window-item>

        <!-- Step 2: Connection Details -->
        <v-stepper-window-item :value="2">
          <div class="pa-6">
            <!-- Context Summary -->
            <div class="text-caption text-medium-emphasis mb-2">
              {{ $t('common.configuring') }}: <span class="font-weight-medium">{{ dataSource.type }}</span> · 
              <span class="font-weight-medium">{{ dataSource.provider }}</span> · 
              <span class="font-weight-medium">{{ dataSource.direction === 'source' ? $t('dataSources.source') : dataSource.direction === 'destination' ? $t('dataSources.destination') : $t('dataSources.sourceAndDestination') }}</span>
            </div>
            
            <div class="text-h5 mb-4">{{ t('common.connectionConfiguration') }}</div>
            
            <!-- Database Connection -->
            <v-row v-if="dataSource.type === 'Database'">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.server"
                  :label="t('dataSources.server')"
                  :placeholder="t('dataSources.serverPlaceholder')"
                  variant="outlined"
                  :rules="[v => !!v || t('validation.required', { field: t('dataSources.server') })]"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.port"
                  :label="t('dataSources.port')"
                  :placeholder="t('dataSources.defaultPort')"
                  variant="outlined"
                  type="number"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.database"
                  :label="t('dataSources.databaseName')"
                  variant="outlined"
                  :rules="[v => !!v || t('validation.required', { field: t('dataSources.databaseName') })]"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.username"
                  :label="t('dataSources.username')"
                  variant="outlined"
                  :rules="[v => !!v || t('validation.required', { field: t('dataSources.username') })]"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.password"
                  :label="t('dataSources.password')"
                  type="password"
                  variant="outlined"
                  :rules="[v => !!v || t('validation.required', { field: t('dataSources.password') })]"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="dataSource.config.useCustomConnectionString"
                  :label="t('dataSources.useCustomConnectionString')"
                  color="primary"
                  hide-details
                />
              </v-col>
              <v-col v-if="dataSource.config.useCustomConnectionString" cols="12">
                <v-textarea
                  v-model="dataSource.config.connectionString"
                  :label="t('dataSources.connectionString')"
                  variant="outlined"
                  rows="3"
                  :rules="[v => !!v || t('validation.required', { field: t('dataSources.connectionString') })]"
                />
              </v-col>
            </v-row>

            <!-- API Connection -->
            <v-row v-else-if="dataSource.type === 'API'">
              <v-col cols="12">
                <v-text-field
                  v-model="dataSource.config.url"
                  :label="t('dataSources.apiUrl')"
                  :placeholder="t('dataSources.apiUrlPlaceholder')"
                  variant="outlined"
                  :rules="[v => !!v || t('validation.required', { field: 'URL' })]"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="dataSource.config.authType"
                  :items="authTypes"
                  :label="t('dataSources.authenticationType')"
                  variant="outlined"
                />
              </v-col>
              <v-col v-if="dataSource.config.authType === 'Bearer'" cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.token"
                  :label="t('dataSources.bearerToken')"
                  type="password"
                  variant="outlined"
                />
              </v-col>
              <v-col v-if="dataSource.config.authType === 'Basic'" cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.username"
                  :label="t('dataSources.username')"
                  variant="outlined"
                />
              </v-col>
              <v-col v-if="dataSource.config.authType === 'Basic'" cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.password"
                  :label="t('dataSources.password')"
                  type="password"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="dataSource.config.headers"
                  :label="t('dataSources.customHeaders')"
                  :placeholder="t('dataSources.customHeadersPlaceholder')"
                  variant="outlined"
                  rows="3"
                />
              </v-col>

              <!-- API Endpoints Configuration -->
              <v-col cols="12">
                <v-divider class="my-4" />
                <ApiEndpointEditor
                  v-model="dataSource.config.endpoints"
                  :direction="dataSource.direction"
                />
              </v-col>
            </v-row>

            <!-- File Connection -->
            <v-row v-else-if="dataSource.type === 'File'">
              <v-col cols="12" md="6">
                <v-select
                  v-model="dataSource.config.format"
                  :items="fileFormats"
                  :label="t('dataSources.fileFormat')"
                  variant="outlined"
                  :rules="[v => !!v || t('validation.required', { field: t('dataSources.fileFormat') })]"
                  required
                />
              </v-col>

              <!-- Local Storage -->
              <template v-if="dataSource.provider === 'Local'">
                <v-col cols="12">
                  <v-text-field
                    v-model="dataSource.config.path"
                    :label="t('dataSources.filePath')"
                    :placeholder="t('dataSources.filePathPlaceholder')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.filePath') })]"
                    required
                  />
                </v-col>
              </template>

              <!-- FTP Storage -->
              <template v-if="dataSource.provider === 'FTP'">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.ftpHost"
                    :label="t('dataSources.ftpHost')"
                    :placeholder="t('dataSources.ftpHostPlaceholder')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: 'Host' })]"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.ftpPort"
                    :label="t('dataSources.port')"
                    placeholder="21"
                    type="number"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.ftpUsername"
                    :label="t('dataSources.username')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.username') })]"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.ftpPassword"
                    :label="t('dataSources.password')"
                    type="password"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.password') })]"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="dataSource.config.path"
                    :label="t('dataSources.filePath')"
                    :placeholder="t('dataSources.remotePathPlaceholder')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.filePath') })]"
                    required
                  />
                </v-col>
              </template>

              <!-- S3 Storage -->
              <template v-if="dataSource.provider === 'S3'">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.s3Bucket"
                    :label="t('dataSources.bucketName')"
                    :placeholder="t('dataSources.bucketPlaceholder')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.bucketName') })]"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.s3Region"
                    :label="t('dataSources.region')"
                    :placeholder="t('dataSources.regionPlaceholder')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.region') })]"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.s3AccessKey"
                    :label="t('dataSources.accessKeyId')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.accessKeyId') })]"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.s3SecretKey"
                    :label="t('dataSources.secretAccessKey')"
                    type="password"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.secretAccessKey') })]"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="dataSource.config.path"
                    :label="t('dataSources.objectKey')"
                    :placeholder="t('dataSources.objectKeyPlaceholder')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.objectKey') })]"
                    required
                  />
                </v-col>
              </template>

              <!-- Azure Blob Storage -->
              <template v-if="dataSource.provider === 'Azure Blob'">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.azureAccountName"
                    :label="t('dataSources.storageAccountName')"
                    :placeholder="t('dataSources.storageAccountPlaceholder')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.storageAccountName') })]"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.azureContainer"
                    :label="t('dataSources.containerName')"
                    :placeholder="t('dataSources.containerPlaceholder')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.containerName') })]"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="dataSource.config.azureAccountKey"
                    :label="t('dataSources.accountKey')"
                    type="password"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.accountKey') })]"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="dataSource.config.path"
                    :label="t('dataSources.blobPath')"
                    :placeholder="t('dataSources.blobPathPlaceholder')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.blobPath') })]"
                    required
                  />
                </v-col>
              </template>

              <!-- Format-specific options (CSV) -->
              <v-col v-if="dataSource.config.format === 'CSV'" cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.delimiter"
                  :label="t('common.delimiter')"
                  placeholder=","
                  variant="outlined"
                />
              </v-col>
              <v-col v-if="dataSource.config.format === 'CSV'" cols="12" md="6">
                <v-switch
                  v-model="dataSource.config.hasHeader"
                  :label="t('common.hasHeaderRow')"
                  color="primary"
                  hide-details
                />
              </v-col>
            </v-row>
          </div>
        </v-stepper-window-item>

        <!-- Step 3: Schema Definition -->
        <v-stepper-window-item :value="3">
          <div class="pa-6">
            <!-- Context Summary -->
            <div class="text-caption text-medium-emphasis mb-2">
              {{ $t('common.configuring') }}: <span class="font-weight-medium">{{ dataSource.type }}</span> · 
              <span class="font-weight-medium">{{ dataSource.provider }}</span><template v-if="dataSource.type === 'File'"> · 
              <span class="font-weight-medium">{{ dataSource.config.format }}</span></template> · 
              <span class="font-weight-medium">{{ dataSource.direction === 'source' ? $t('dataSources.source') : dataSource.direction === 'destination' ? $t('dataSources.destination') : $t('dataSources.sourceAndDestination') }}</span>
            </div>
            
            <div class="text-h5 mb-4">{{ t('dataSources.schemaDefinition') }}</div>
            
            <SchemaEditor
              v-model="dataSource.schema.fields"
              @validate="handleSchemaValidation"
            />
          </div>
        </v-stepper-window-item>

        <!-- Step 4: Write Configuration (only for destinations) -->
        <v-stepper-window-item v-if="showWriteConfigStep" :value="4">
          <div class="pa-6">
            <!-- Context Summary -->
            <div class="text-caption text-medium-emphasis mb-2">
              {{ $t('common.configuring') }}: <span class="font-weight-medium">{{ dataSource.type }}</span> · 
              <span class="font-weight-medium">{{ dataSource.provider }}</span><template v-if="dataSource.type === 'File'"> · 
              <span class="font-weight-medium">{{ dataSource.config.format }}</span></template> · 
              <span class="font-weight-medium">{{ dataSource.direction === 'source' ? $t('dataSources.source') : dataSource.direction === 'destination' ? $t('dataSources.destination') : $t('dataSources.sourceAndDestination') }}</span> · 
              <span class="font-weight-medium">{{ dataSource.schema.fields.length }} {{ $t('dataSources.fields', dataSource.schema.fields.length) }}</span>
            </div>
            
            <div class="text-h5 mb-4">{{ $t('common.writeConfiguration') }}</div>
            
            <p class="text-body-2 text-medium-emphasis mb-6">
              {{ $t('dataSources.writeConfigDescription') }}
            </p>

            <!-- Database Write Config -->
            <v-row v-if="dataSource.type === 'Database'">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.writeConfig.tableName"
                  :label="t('dataSources.tableName')"
                  :placeholder="t('dataSources.tableNamePlaceholder')"
                  variant="outlined"
                  :rules="[v => !!v || t('validation.required', { field: t('dataSources.tableName') })]"
                  required
                  :hint="t('dataSources.tableNameHint')"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="dataSource.config.writeConfig.operation"
                  :items="['INSERT', 'UPDATE', 'UPSERT', 'BULK_INSERT']"
                  :label="t('dataSources.writeOperation')"
                  variant="outlined"
                  :hint="t('dataSources.writeOperationHint')"
                  persistent-hint
                >
                  <template #item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template #subtitle>
                        <span v-if="item.value === 'INSERT'">{{ $t('dataSources.insertDescription') }}</span>
                        <span v-else-if="item.value === 'UPDATE'">{{ $t('dataSources.updateDescription') }}</span>
                        <span v-else-if="item.value === 'UPSERT'">{{ $t('dataSources.upsertDescription') }}</span>
                        <span v-else-if="item.value === 'BULK_INSERT'">{{ $t('dataSources.bulkInsertDescription') }}</span>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              <v-col v-if="['UPDATE', 'UPSERT'].includes(dataSource.config.writeConfig.operation)" cols="12">
                <v-combobox
                  v-model="dataSource.config.writeConfig.primaryKeys"
                  :items="dataSource.schema.fields.map(f => f.name)"
                  :label="t('dataSources.primaryKeyFields')"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                  :rules="[v => (v && v.length > 0) || t('dataSources.primaryKeyRequired')]"
                  :hint="t('dataSources.primaryKeyHint')"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="dataSource.config.writeConfig.batchSize"
                  :label="t('dataSources.batchSize')"
                  type="number"
                  variant="outlined"
                  :hint="t('dataSources.batchSizeHint')"
                  persistent-hint
                  :min="1"
                  :max="10000"
                />
              </v-col>
            </v-row>

            <!-- API Write Config -->
            <v-row v-else-if="dataSource.type === 'API'">
              <v-col cols="12" md="6">
                <v-select
                  v-model="dataSource.config.writeConfig.requestFormat"
                  :items="['JSON', 'XML', 'Form Data']"
                  :label="t('dataSources.requestFormat')"
                  variant="outlined"
                  :hint="t('dataSources.requestFormatHint')"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="dataSource.config.writeConfig.wrapInArray"
                  :label="t('dataSources.wrapDataInArray')"
                  color="primary"
                  :hint="t('dataSources.wrapDataHint')"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dataSource.config.writeConfig.rootKey"
                  :label="t('dataSources.rootKeyOptional')"
                  :placeholder="t('dataSources.rootKeyPlaceholder')"
                  variant="outlined"
                  :hint="t('dataSources.rootKeyHint')"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="dataSource.config.writeConfig.batchSize"
                  :label="t('dataSources.batchSize')"
                  type="number"
                  variant="outlined"
                  :hint="t('dataSources.recordsPerRequest')"
                  persistent-hint
                  :min="1"
                  :max="1000"
                />
              </v-col>
            </v-row>

            <!-- File Write Config -->
            <v-row v-else-if="dataSource.type === 'File'">
              <v-col cols="12">
                <v-text-field
                  v-model="dataSource.config.writeConfig.filenamePattern"
                  :label="t('dataSources.filenamePattern')"
                  variant="outlined"
                  :placeholder="t('dataSources.filenamePatternPlaceholder')"
                  :hint="t('dataSources.filenamePatternHint', { format: dataSource.config.format })"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12">
                <div class="text-caption text-medium-emphasis mb-2">
                  {{ $t('dataSources.availablePlaceholders') }}:
                </div>
                <v-tooltip :text="$t('dataSources.dateFormatTooltip')" location="top">
                  <template #activator="{ props }">
                    <v-chip size="small" class="mr-2 mb-2" v-bind="props">{date}</v-chip>
                  </template>
                </v-tooltip>
                <v-tooltip :text="$t('dataSources.timeFormatTooltip')" location="top">
                  <template #activator="{ props }">
                    <v-chip size="small" class="mr-2 mb-2" v-bind="props">{time}</v-chip>
                  </template>
                </v-tooltip>
                <v-tooltip :text="$t('dataSources.timestampTooltip')" location="top">
                  <template #activator="{ props }">
                    <v-chip size="small" class="mr-2 mb-2" v-bind="props">{timestamp}</v-chip>
                  </template>
                </v-tooltip>
                <v-tooltip :text="$t('dataSources.pipelineTooltip')" location="top">
                  <template #activator="{ props }">
                    <v-chip size="small" class="mr-2 mb-2" v-bind="props">{pipeline}</v-chip>
                  </template>
                </v-tooltip>
                <v-tooltip :text="$t('dataSources.executionIdTooltip')" location="top">
                  <template #activator="{ props }">
                    <v-chip size="small" class="mr-2 mb-2" v-bind="props">{executionId}</v-chip>
                  </template>
                </v-tooltip>
                <div class="text-caption text-medium-emphasis mt-2">
                  {{ $t('dataSources.filenameExample') }}
                </div>
              </v-col>

              <!-- CSV Specific -->
              <template v-if="dataSource.config.format === 'CSV'">
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="dataSource.config.writeConfig.includeHeaders"
                    :label="t('dataSources.includeHeaderRow')"
                    color="primary"
                    :hint="t('dataSources.includeHeaderHint')"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12">
                  <v-combobox
                    v-model="dataSource.config.writeConfig.columnOrder"
                    :items="dataSource.schema.fields.map(f => f.name)"
                    :label="t('dataSources.columnOrder')"
                    variant="outlined"
                    multiple
                    chips
                    closable-chips
                    :hint="t('dataSources.columnOrderHint')"
                    persistent-hint
                  />
                </v-col>
              </template>

              <!-- Excel Specific -->
              <template v-if="dataSource.config.format === 'Excel'">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.writeConfig.sheetName"
                    :label="t('dataSources.sheetName')"
                    :placeholder="t('dataSources.sheetNamePlaceholder')"
                    variant="outlined"
                    :rules="[v => !!v || t('validation.required', { field: t('dataSources.sheetName') })]"
                    :hint="t('dataSources.sheetNameHint')"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.writeConfig.startCell"
                    :label="t('dataSources.startCell')"
                    :placeholder="t('dataSources.startCellPlaceholder')"
                    variant="outlined"
                    :hint="t('dataSources.startCellHint')"
                    persistent-hint
                  />
                </v-col>
              </template>

              <!-- JSON Specific -->
              <template v-if="dataSource.config.format === 'JSON'">
                <v-col cols="12" md="6">
                  <v-select
                    v-model="dataSource.config.writeConfig.structure"
                    :items="['array', 'object', 'nested']"
                    :label="t('dataSources.jsonStructure')"
                    variant="outlined"
                    :hint="t('dataSources.jsonStructureHint')"
                    persistent-hint
                  >
                    <template #item="{ item, props }">
                      <v-list-item v-bind="props">
                        <template #subtitle>
                          <span v-if="item.value === 'array'">{{ $t('dataSources.arrayOfObjects') }}</span>
                          <span v-else-if="item.value === 'object'">{{ $t('dataSources.singleObject') }}</span>
                          <span v-else>{{ $t('dataSources.nestedStructure') }}</span>
                        </template>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-col>
                <v-col v-if="dataSource.config.writeConfig.structure === 'nested'" cols="12" md="6">
                  <v-text-field
                    v-model="dataSource.config.writeConfig.rootKey"
                    :label="t('dataSources.rootKey')"
                    :placeholder="t('dataSources.rootKeyPlaceholder')"
                    variant="outlined"
                    :hint="t('dataSources.rootKeyNestedHint')"
                    persistent-hint
                  />
                </v-col>
              </template>
            </v-row>
          </div>
        </v-stepper-window-item>

        <!-- Step 4/5: Review & Save -->
        <v-stepper-window-item :value="showWriteConfigStep ? 5 : 4">
          <div class="pa-6">
            <div class="text-h5 mb-4">{{ t('common.reviewConfiguration') }}</div>
            
            <!-- Basic Information -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-information</v-icon>
                {{ t('executions.basicInformation') }}
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item>
                    <template #prepend>
                      <v-icon>mdi-label</v-icon>
                    </template>
                    <v-list-item-title>{{ t('common.name') }}</v-list-item-title>
                    <v-list-item-subtitle>{{ dataSource.name }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="dataSource.description">
                    <template #prepend>
                      <v-icon>mdi-text</v-icon>
                    </template>
                    <v-list-item-title>{{ t('common.description') }}</v-list-item-title>
                    <v-list-item-subtitle>{{ dataSource.description }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template #prepend>
                      <v-icon>{{ getTypeIcon(dataSource.type) }}</v-icon>
                    </template>
                    <v-list-item-title>{{ t('common.type') }}</v-list-item-title>
                    <v-list-item-subtitle>{{ dataSource.type }} - {{ dataSource.provider }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template #prepend>
                      <v-icon>{{ getDirectionIcon(dataSource.direction) }}</v-icon>
                    </template>
                    <v-list-item-title>{{ t('dataSources.direction') }}</v-list-item-title>
                    <v-list-item-subtitle>{{ getDirectionLabel(dataSource.direction) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Connection Details -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-connection</v-icon>
                {{ t('common.connectionDetails') }}
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <!-- Database Connection Details -->
                  <template v-if="dataSource.type === 'Database'">
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-server</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.server') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.server }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.port">
                      <template #prepend>
                        <v-icon>mdi-network</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.port') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.port }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-database</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.database') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.database }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-account</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.username') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.username }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.useCustomConnectionString">
                      <template #prepend>
                        <v-icon>mdi-link-variant</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.customConnectionString') }}</v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ dataSource.config.connectionString }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>

                  <!-- API Connection Details -->
                  <template v-if="dataSource.type === 'API'">
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-web</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.baseUrl') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.url }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-shield-lock</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.authentication') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.authType }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.headers">
                      <template #prepend>
                        <v-icon>mdi-code-json</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.customHeaders') }}</v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ dataSource.config.headers }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>

                  <!-- File Connection Details -->
                  <template v-if="dataSource.type === 'File'">
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-file-document</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.format') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.format }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon v-if="dataSource.provider === 'Local'">mdi-folder</v-icon>
                        <v-icon v-else-if="dataSource.provider === 'FTP'">mdi-server-network</v-icon>
                        <v-icon v-else-if="dataSource.provider === 'S3'">mdi-aws</v-icon>
                        <v-icon v-else-if="dataSource.provider === 'Azure Blob'">mdi-microsoft-azure</v-icon>
                        <v-icon v-else>mdi-cloud</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.storageProvider') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.provider }}</v-list-item-subtitle>
                    </v-list-item>
                    <template v-if="dataSource.provider === 'FTP'">
                      <v-list-item>
                        <template #prepend>
                          <v-icon>mdi-server</v-icon>
                        </template>
                        <v-list-item-title>{{ t('dataSources.ftpHost') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ dataSource.config.ftpHost }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <template #prepend>
                          <v-icon>mdi-network</v-icon>
                        </template>
                        <v-list-item-title>{{ t('dataSources.port') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ dataSource.config.ftpPort || '21' }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <template #prepend>
                          <v-icon>mdi-account</v-icon>
                        </template>
                        <v-list-item-title>{{ t('dataSources.username') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ dataSource.config.ftpUsername }}</v-list-item-subtitle>
                      </v-list-item>
                    </template>
                    <template v-if="dataSource.provider === 'S3'">
                      <v-list-item>
                        <template #prepend>
                          <v-icon>mdi-bucket</v-icon>
                        </template>
                        <v-list-item-title>{{ t('dataSources.s3Bucket') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ dataSource.config.s3Bucket }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <template #prepend>
                          <v-icon>mdi-earth</v-icon>
                        </template>
                        <v-list-item-title>{{ t('dataSources.region') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ dataSource.config.s3Region }}</v-list-item-subtitle>
                      </v-list-item>
                    </template>
                    <template v-if="dataSource.provider === 'Azure Blob'">
                      <v-list-item>
                        <template #prepend>
                          <v-icon>mdi-table-large</v-icon>
                        </template>
                        <v-list-item-title>{{ t('dataSources.storageAccount') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ dataSource.config.azureAccountName }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <template #prepend>
                          <v-icon>mdi-package-variant</v-icon>
                        </template>
                        <v-list-item-title>{{ t('dataSources.container') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ dataSource.config.azureContainer }}</v-list-item-subtitle>
                      </v-list-item>
                    </template>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-folder</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.path') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.path }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.format === 'CSV'">
                      <template #prepend>
                        <v-icon>mdi-table-split-cell</v-icon>
                      </template>
                      <v-list-item-title>{{ t('common.delimiter') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.delimiter || ',' }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.format === 'CSV'">
                      <template #prepend>
                        <v-icon>mdi-format-header-1</v-icon>
                      </template>
                      <v-list-item-title>{{ t('common.hasHeaderRow') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.hasHeader ? t('common.yes') : t('common.no') }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- API Endpoints (if applicable) -->
            <v-card v-if="dataSource.type === 'API' && dataSource.config.endpoints && dataSource.config.endpoints.length > 0" variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-api</v-icon>
                {{ t('dataSources.apiEndpoints') }} ({{ dataSource.config.endpoints.length }})
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item v-for="endpoint in dataSource.config.endpoints" :key="endpoint.id">
                    <template #prepend>
                      <v-chip :color="getMethodColor(endpoint.method)" size="small">
                        {{ endpoint.method }}
                      </v-chip>
                    </template>
                    <v-list-item-title>{{ endpoint.path }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Schema Fields -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-table</v-icon>
                {{ t('dataSources.schemaFields') }} ({{ dataSource.schema.fields.length }})
              </v-card-title>
              <v-card-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>{{ t('dataSources.fieldName') }}</th>
                      <th>{{ t('dataSources.dataType') }}</th>
                      <th>{{ t('common.required') }}</th>
                      <th>{{ t('common.description') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="field in dataSource.schema.fields" :key="field.id">
                      <td>
                        <v-icon v-if="field.isPrimaryKey" size="small" color="primary" class="mr-1">mdi-key</v-icon>
                        {{ field.name }}
                      </td>
                      <td>
                        <v-chip size="x-small" variant="outlined">{{ field.type }}</v-chip>
                      </td>
                      <td>
                        <v-icon v-if="field.required" size="small" color="error">mdi-check-circle</v-icon>
                        <v-icon v-else size="small" color="grey">mdi-circle-outline</v-icon>
                      </td>
                      <td class="text-caption text-medium-emphasis">{{ field.description || '-' }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
            </v-card>

            <!-- Write Configuration (if destination) -->
            <v-card v-if="showWriteConfigStep && dataSource.config.writeConfig" variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 bg-surface-variant">
                <v-icon class="mr-2">mdi-pencil</v-icon>
                {{ t('common.writeConfiguration') }}
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <!-- Database Write Config -->
                  <template v-if="dataSource.type === 'Database'">
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-table</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.tableName') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.tableName }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-database-edit</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.operation') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.operation }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.writeConfig.primaryKeys && dataSource.config.writeConfig.primaryKeys.length > 0">
                      <template #prepend>
                        <v-icon>mdi-key</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.primaryKeys') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.primaryKeys.join(', ') }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-package-variant</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.batchSize') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.batchSize }} {{ t('dataSources.records') }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>

                  <!-- API Write Config -->
                  <template v-if="dataSource.type === 'API'">
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-code-json</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.requestFormat') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.requestFormat }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-format-list-bulleted</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.wrapInArray') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.wrapInArray ? t('common.yes') : t('common.no') }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.writeConfig.rootKey">
                      <template #prepend>
                        <v-icon>mdi-key-variant</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.rootKey') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.rootKey }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-package-variant</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.batchSize') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.batchSize }} {{ t('dataSources.records') }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>

                  <!-- File Write Config -->
                  <template v-if="dataSource.type === 'File'">
                    <v-list-item v-if="dataSource.config.writeConfig.filenamePattern">
                      <template #prepend>
                        <v-icon>mdi-file-outline</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.filenamePattern') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.filenamePattern }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.format === 'CSV'">
                      <template #prepend>
                        <v-icon>mdi-format-header-1</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.includeHeaders') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.includeHeaders ? t('common.yes') : t('common.no') }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.format === 'CSV' && dataSource.config.writeConfig.columnOrder && dataSource.config.writeConfig.columnOrder.length > 0">
                      <template #prepend>
                        <v-icon>mdi-sort</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.columnOrder') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.columnOrder.join(', ') }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.format === 'Excel'">
                      <template #prepend>
                        <v-icon>mdi-file-excel</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.sheetName') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.sheetName }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.format === 'Excel'">
                      <template #prepend>
                        <v-icon>mdi-table-large</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.startCell') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.startCell }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.format === 'JSON'">
                      <template #prepend>
                        <v-icon>mdi-code-braces</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.jsonStructure') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.structure }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="dataSource.config.format === 'JSON' && dataSource.config.writeConfig.rootKey">
                      <template #prepend>
                        <v-icon>mdi-key-variant</v-icon>
                      </template>
                      <v-list-item-title>{{ t('dataSources.rootKey') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ dataSource.config.writeConfig.rootKey }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-list>
              </v-card-text>
            </v-card>
          </div>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>

    <v-divider />

    <v-card-actions class="pa-4">
      <v-btn
        v-if="currentStep > 1"
        variant="outlined"
        prepend-icon="mdi-chevron-left"
        @click="currentStep--"
      >
        {{ t('common.back') }}
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="currentStep < (showWriteConfigStep ? 5 : 4)"
        color="primary"
        variant="elevated"
        append-icon="mdi-chevron-right"
        :disabled="!canProceed"
        @click="currentStep++"
      >
        {{ t('common.next') }}
      </v-btn>
      <v-btn
        v-else
        color="primary"
        variant="elevated"
        prepend-icon="mdi-content-save"
        :loading="saving"
        :disabled="!canSave"
        @click="handleSave"
      >
        {{ t('common.save') }}
        <v-tooltip activator="parent" location="top">{{ t('common.saveDataSource') }}</v-tooltip>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SchemaEditor from './SchemaEditor.vue';

const { t } = useI18n();
import ApiEndpointEditor from './ApiEndpointEditor.vue';

const props = defineProps({
  dataSource: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      description: '',
      type: '',
      provider: '',
      direction: 'source',
      config: {},
      schema: { fields: [] }
    })
  },
  dataSources: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['save', 'close', 'toggle-fullscreen']);

const currentStep = ref(1);
const saving = ref(false);
const schemaValidation = ref({ isValid: true, errors: [] });

const dataSourceTypes = computed(() => [
  { title: t('dataSources.database'), value: 'Database' },
  { title: t('dataSources.api'), value: 'API' },
  { title: t('dataSources.file'), value: 'File' }
]);

const directionOptions = computed(() => [
  { title: t('dataSources.sourceOnly'), value: 'source', icon: 'mdi-download' },
  { title: t('dataSources.destinationOnly'), value: 'destination', icon: 'mdi-upload' },
  { title: t('dataSources.both'), value: 'both', icon: 'mdi-swap-horizontal' }
]);

const providersByType = {
  Database: ['SQL Server', 'PostgreSQL', 'MySQL', 'Oracle'],
  API: ['REST'],
  File: ['Local', 'FTP', 'S3', 'Azure Blob']
};

const authTypes = computed(() => [
  t('dataSources.authNone'),
  t('dataSources.authBasic'),
  t('dataSources.authBearer'),
  t('dataSources.authOAuth2')
]);
const fileFormats = computed(() => ['CSV', 'JSON', 'XML', 'Excel']);
const httpMethods = {
  source: ['GET'],
  destination: ['POST', 'PUT', 'PATCH']
};

const providerOptions = computed(() => {
  return providersByType[props.dataSource.type] || [];
});

const showWriteConfigStep = computed(() => {
  return props.dataSource.direction === 'destination' || props.dataSource.direction === 'both';
});

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return !!props.dataSource.name && !!props.dataSource.type && !!props.dataSource.provider;
    case 2:
      return validateConnectionConfig();
    case 3:
      return schemaValidation.value.isValid && props.dataSource.schema.fields.length > 0;
    case 4:
      if (showWriteConfigStep.value) {
        return validateWriteConfig();
      }
      return true; // Review step
    case 5:
      return true; // Review step when write config is shown
    default:
      return false;
  }
});

const canSave = computed(() => {
  const baseValid = props.dataSource.name &&
         props.dataSource.type &&
         props.dataSource.provider &&
         validateConnectionConfig() &&
         schemaValidation.value.isValid &&
         props.dataSource.schema.fields.length > 0;
  
  if (showWriteConfigStep.value) {
    return baseValid && validateWriteConfig();
  }
  
  return baseValid;
});

function getTypeIcon(type) {
  const icons = {
    Database: 'mdi-database',
    API: 'mdi-api',
    File: 'mdi-file'
  };
  return icons[type] || 'mdi-help-circle';
}

function getDirectionIcon(direction) {
  const icons = {
    source: 'mdi-download',
    destination: 'mdi-upload',
    both: 'mdi-swap-horizontal'
  };
  return icons[direction] || 'mdi-help-circle';
}

function getDirectionLabel(direction) {
  const labels = {
    source: t('dataSources.sourceOnly'),
    destination: t('dataSources.destinationOnly'),
    both: t('dataSources.both')
  };
  return labels[direction] || direction;
}

function getMethodColor(method) {
  const colors = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    PATCH: 'purple',
    DELETE: 'red'
  };
  return colors[method] || 'grey';
}

function handleTypeChange() {
  props.dataSource.provider = '';
  props.dataSource.config = getDefaultConfig(props.dataSource.type);
}

function getDefaultConfig(type) {
  switch (type) {
    case 'Database':
      return {
        server: '',
        port: '',
        database: '',
        username: '',
        password: '',
        useCustomConnectionString: false,
        connectionString: '',
        writeConfig: {
          tableName: '',
          operation: 'INSERT',
          primaryKeys: [],
          batchSize: 1000
        }
      };
    case 'API':
      return {
        url: '',
        authType: 'None',
        token: '',
        username: '',
        password: '',
        headers: '',
        endpoints: [],
        writeConfig: {
          requestFormat: 'JSON',
          wrapInArray: false,
          rootKey: '',
          batchSize: 100
        }
      };
    case 'File':
      return {
        format: 'CSV',
        path: '',
        delimiter: ',',
        hasHeader: true,
        // FTP fields
        ftpHost: '',
        ftpPort: '21',
        ftpUsername: '',
        ftpPassword: '',
        // S3 fields
        s3Bucket: '',
        s3Region: '',
        s3AccessKey: '',
        s3SecretKey: '',
        // Azure Blob fields
        azureAccountName: '',
        azureContainer: '',
        azureAccountKey: '',
        writeConfig: {
          filenamePattern: '',
          includeHeaders: true,
          columnOrder: [],
          sheetName: 'Sheet1',
          startCell: 'A1',
          structure: 'array',
          rootKey: ''
        }
      };
    default:
      return {};
  }
}

function validateConnectionConfig() {
  const { type, config, direction } = props.dataSource;
  
  if (type === 'Database') {
    if (config.useCustomConnectionString) {
      return !!config.connectionString;
    }
    return !!config.server && !!config.database && !!config.username && !!config.password;
  }
  
  if (type === 'API') {
    // Check basic config
    if (!config.url) return false;
    
    // Check endpoints are configured
    if (!config.endpoints || config.endpoints.length === 0) return false;
    
    // Validate direction-specific endpoint requirements
    const hasGetEndpoint = config.endpoints.some(e => e.method === 'GET');
    const hasWriteEndpoint = config.endpoints.some(e => ['POST', 'PUT', 'PATCH'].includes(e.method));
    
    if (direction === 'source' && !hasGetEndpoint) {
      return false; // Source needs at least one GET endpoint
    }
    
    if (direction === 'destination' && !hasWriteEndpoint) {
      return false; // Destination needs at least one POST/PUT/PATCH endpoint
    }
    
    if (direction === 'both' && (!hasGetEndpoint || !hasWriteEndpoint)) {
      return false; // Both needs at least one GET and one write endpoint
    }
    
    // Validate each endpoint has required fields
    return config.endpoints.every(endpoint => {
      const hasBasics = endpoint.method && endpoint.path && endpoint.responseDataPath;
      
      // For write methods, also need request configuration
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        return hasBasics && endpoint.requestDataPath;
      }
      
      return hasBasics;
    });
  }
  
  if (type === 'File') {
    const provider = props.dataSource.provider;
    if (!config.format || !provider) return false;
    
    // Validate provider-specific fields
    if (provider === 'Local') {
      return !!config.path;
    }
    
    if (provider === 'FTP') {
      return !!config.ftpHost && !!config.ftpUsername && !!config.ftpPassword && !!config.path;
    }
    
    if (provider === 'S3') {
      return !!config.s3Bucket && !!config.s3Region && !!config.s3AccessKey && !!config.s3SecretKey && !!config.path;
    }
    
    if (provider === 'Azure Blob') {
      return !!config.azureAccountName && !!config.azureContainer && !!config.azureAccountKey && !!config.path;
    }
    
    return false;
  }
  
  return false;
}

function validateWriteConfig() {
  const { type, config } = props.dataSource;
  
  if (!config.writeConfig) return false;
  
  if (type === 'Database') {
    // Table name is required
    if (!config.writeConfig.tableName) return false;
    
    // For UPDATE/UPSERT operations, primary keys are required
    if (['UPDATE', 'UPSERT'].includes(config.writeConfig.operation)) {
      return config.writeConfig.primaryKeys && config.writeConfig.primaryKeys.length > 0;
    }
    
    return true;
  }
  
  if (type === 'API') {
    // Request format is required
    return !!config.writeConfig.requestFormat;
  }
  
  if (type === 'File') {
    // Write mode is required
    if (!config.writeConfig.writeMode) return false;
    
    // For CSV, column order should be defined (can be empty initially)
    if (config.format === 'CSV') {
      return config.writeConfig.columnOrder !== undefined;
    }
    
    // For Excel, sheet name is required
    if (config.format === 'Excel') {
      return !!config.writeConfig.sheetName;
    }
    
    // For JSON, structure is required
    if (config.format === 'JSON') {
      return !!config.writeConfig.structure;
    }
    
    return true;
  }
  
  return false;
}

function handleSchemaValidation(validation) {
  schemaValidation.value = validation;
}

async function handleSave() {
  if (!canSave.value) return;
  
  saving.value = true;
  try {
    emit('save', props.dataSource);
  } finally {
    saving.value = false;
  }
}

// Initialize config if empty
watch(() => props.dataSource.type, (newType) => {
  if (newType && !props.dataSource.config) {
    props.dataSource.config = getDefaultConfig(newType);
  }
}, { immediate: true });
</script>

<style scoped>
.wizard-card {
  display: flex;
  flex-direction: column;
}

.wizard-stepper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.wizard-stepper :deep(.v-stepper-header) {
  flex-shrink: 0;
  padding: 24px 16px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

/* Style stepper items */
.wizard-stepper :deep(.v-stepper-item) {
  padding: 12px 16px;
}

.wizard-stepper :deep(.v-stepper-item__avatar) {
  margin-bottom: 8px;
  width: 40px;
  height: 40px;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-surface), 1);
}

.wizard-stepper :deep(.v-stepper-item--selected .v-stepper-item__avatar) {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 8px rgba(var(--v-theme-primary), 0.3);
  transform: scale(1.1);
  transition: all 0.3s ease;
}

.wizard-stepper :deep(.v-stepper-item--complete .v-stepper-item__avatar) {
  background: rgb(var(--v-theme-success));
  border-color: rgb(var(--v-theme-success));
}

.wizard-stepper :deep(.v-stepper-item__title) {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.wizard-stepper :deep(.v-stepper-item--selected .v-stepper-item__title) {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.wizard-stepper :deep(.v-stepper-item__subtitle) {
  font-size: 12px;
  opacity: 0.7;
}

/* Step arrow between items */
.step-arrow {
  color: rgba(var(--v-theme-primary), 0.5);
  font-size: 28px;
  margin: 0 16px;
  align-self: center;
  margin-top: 20px;
}

.stepper-window {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.stepper-window :deep(.v-stepper-window-item) {
  background: transparent !important;
}


</style>
