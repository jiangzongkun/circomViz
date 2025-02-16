<template>
  <div class="fixed top-4 left-4 right-4" style="max-width: 400px">
    <el-alert v-if="isCompilationFail" :title="compilationFailMessage" type="error" show-icon
      @close="isCompilationFail = false" />
  </div>
  <div class="flex flex-col flex-nowrap h-full w-full">
    <div class="flex flex-row flex-nowrap justify-between">
      <div class="text-base font-bold mb-2">Code Input</div>
      <div class="mb-2">
        <el-button type="primary" plain :disabled="!codeEmpty" @click="fillExampleCode">Example</el-button>
        <el-button type="warning" plain :disabled="codeEmpty" @click="cleanCode">Clean</el-button>
      </div>
    </div>
    <div class="flex-grow border">
      <MonacoEditor v-model="circuitStore.code" @validation="handleEditorValidation" style="min-height: 300px; height: 99%;"/>
    </div>
    <div class="">
      <el-button @click="generateCircuit" type="primary" class="mt-2">Generate Circuit</el-button>
      <el-alert v-if="error" type="error" class="mt-4">{{ error }}</el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import MonacoEditor from '@/components/MonacoEditor.vue';
import { generate_circuit, generate_circuit_request, generate_circuit_response } from '@/apis/index.ts';
import { useCircuitStore } from '@/stores/circuit';

const codeEmpty = computed(() => {
  return circuitStore.code.length === 0;
})
const circuitStore = useCircuitStore();
const error = ref<string>('');
const isCompilationFail = ref(false);
const compilationFailMessage = ref('');

const generateCircuit = async () => {
  if (!circuitStore.code) {
    console.log("Empty code");
  } else {
    let data: generate_circuit_request = {
      code: circuitStore.code,
    };

    generate_circuit(data).then((response: generate_circuit_response) => {
      console.log("Circom code compiled:", response.compilationId);

      circuitStore.setCompilationId(response.compilationId);
      circuitStore.setConstraints(response.circuitData.constraints);
      circuitStore.setSubstitutions(response.circuitData.substitutions);
      circuitStore.setSymbols(response.circuitData.symbols);

    }).catch((err: any) => {
      if (err.response?.status === 400) {
        compilationFailMessage.value = 'Circom code compilation failed.';
        isCompilationFail.value = true;
        return; // Interrupt the function
      }
      console.log(error);
      error.value = err.response?.data?.error || 'Error generating circuit';
    });
  }
};

const fillExampleCode = () => {
  circuitStore.setCode(
    `pragma circom 2.0.0;

      template Internal() {
      signal input in[2];
      signal output out;
      out <== in[0]*in[1];
      }

    template Main() {
      signal input in[2];
      signal output out;
      component c = Internal ();
      c.in[0] <== in[0];
      c.in[1] <== in[1]+2*in[0]+1;
      c.out ==> out;
    }

    component main { public [ in ] } = Main();`)
}

const cleanCode = () => {
  circuitStore.setCode('');
}

watch(isCompilationFail, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      isCompilationFail.value = false;
    }, 5000);
  }
});

const handleEditorValidation = (markers: any) => {
  error.value = markers.length > 0 
    ? markers[0].message 
    : null;
};
</script>

<style lang="css" scoped>
:deep(textarea) {
  height: 100%;
}

.el-alert {
  margin: 20px 0 0;
}

.el-alert:first-child {
  margin: 0;
}
</style>
