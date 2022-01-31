import { ServiceState } from '..';
import { Id } from '@feathersjs/feathers';
export default function makeServiceGetters(): {
    list: (state: any) => unknown[];
    temps: (state: any) => unknown[];
    itemsAndTemps: (state: any, getters: any) => any;
    itemsAndClones: (state: any, getters: any) => any;
    itemsTempsAndClones: (state: any, getters: any) => any;
    operators: (state: any) => string[];
    find: (state: any, getters: any) => (_params: any) => {
        total: any;
        limit: any;
        skip: any;
        data: any;
    };
    ids: (state: any, getters: any) => any;
    count: (state: any, getters: any) => (_params: any) => any;
    get: ({ keyedById, tempsById, idField, tempIdField }: {
        keyedById: any;
        tempsById: any;
        idField: any;
        tempIdField: any;
    }) => (_id: any, _params?: {}) => any;
    getCopyById: (state: any) => (id: any) => any;
    isCreatePendingById: ({ isIdCreatePending }: ServiceState) => (id: Id) => boolean;
    isUpdatePendingById: ({ isIdUpdatePending }: ServiceState) => (id: Id) => boolean;
    isPatchPendingById: ({ isIdPatchPending }: ServiceState) => (id: Id) => boolean;
    isRemovePendingById: ({ isIdRemovePending }: ServiceState) => (id: Id) => boolean;
    isSavePendingById: (state: ServiceState, getters: any) => (id: Id) => any;
    isPendingById: (state: ServiceState, getters: any) => (id: Id) => any;
};
export declare type GetterName = keyof ReturnType<typeof makeServiceGetters>;
