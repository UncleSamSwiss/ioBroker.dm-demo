import { type DeviceDetails, type DeviceLoadContext, DeviceManagement, type InstanceDetails } from '@iobroker/dm-utils';
import { randomUUID } from 'node:crypto';
import type { DmDemo } from './main';

const deviceWithoutState = {
    id: 'new-device',
    name: 'Device without state',
    connectionType: 'other',
    status: {
        connection: 'disconnected',
    },
    identifier: 'n/a',
} as const;

/**
 * Device management class for the dm-demo adapter.
 */
export class DmDemoDeviceManagement extends DeviceManagement<DmDemo> {
    protected override async getInstanceInfo(): Promise<InstanceDetails> {
        const testVar = await this.adapter.getStateAsync('testVariable');
        const info = await super.getInstanceInfo();
        info.identifierLabel = 'UUID';
        info.actions ??= [];
        info.actions.push(
            {
                id: 'add-device',
                title: 'Add Device',
                icon: 'add',
                inputBefore: {
                    label: 'New device name',
                    type: 'text',
                },
                handler: async (context, options) => {
                    await this.addDevice(options?.value ?? 'Unnamed Device');

                    return { refresh: true };
                },
            },
            {
                id: 'add-many',
                title: 'Add Many Devices',
                icon: 'forward',
                inputBefore: {
                    label: 'Number of new devices',
                    type: 'number',
                    min: 0,
                    max: 100,
                    step: 1,
                },
                handler: async (context, options) => {
                    const count = Number(options?.value || 0);
                    if (count == 0) {
                        await context.showMessage('Please enter a number greater than 0');
                        return { refresh: false };
                    }

                    const confirmed = await context.showConfirmation(`Are you sure you want to add ${count} devices?`);
                    if (!confirmed) {
                        return { refresh: false };
                    }

                    const progress = await context.openProgress('Adding devices...', { value: 0 });

                    for (let i = 1; i <= count; i++) {
                        await delay(200); // Simulate some delay in creating devices

                        await this.addDevice();

                        await progress.update({
                            value: (i / count) * 100,
                            label: `Added ${i} of ${count} devices`,
                        });
                    }

                    await progress.close();

                    return { refresh: true };
                },
            },
            {
                id: 'test-var',
                icon: 'socket',
                title: `Toggle Test Var: ${testVar?.val ?? '?'}`,
                handler: async () => {
                    await this.adapter.setState('testVariable', { val: !testVar?.val, ack: true });
                    return { refresh: true };
                },
            },
        );
        return info;
    }

    protected override async loadDevices(context: DeviceLoadContext<string>): Promise<void> {
        this.log.debug(`Loading devices...`);
        const devices = await this.adapter.getDevicesAsync();
        this.log.debug(`Found ${devices.length} devices`);
        context.setTotalDevices(devices.length + 1);
        this.log.debug(`Adding devices, total count: ${devices.length + 1}`);

        for (const device of devices) {
            context.addDevice({
                id: device._id.replace(/^.+\./, ''),
                identifier: device.native.uuid,
                name: {
                    objectId: device._id,
                    property: 'common.name',
                },
                hasDetails: true,
                connectionType: {
                    stateId: `${device._id}.type`,
                },
                status: {
                    connection: {
                        stateId: `${device._id}.online`,
                        mapping: {
                            true: 'connected',
                            false: 'disconnected',
                        },
                    },
                },
                actions: [
                    {
                        id: 'info',
                        description: 'Show device info',
                        icon: 'info',
                        url: 'https://www.iobroker.dev/adapter/UncleSamSwiss/ioBroker.dm-demo',
                    },
                    {
                        id: 'toggle-online',
                        description: 'Toggle online status',
                        icon: 'socket',
                        handler: async deviceId => {
                            const stateId = `${deviceId}.online`;
                            const state = await this.adapter.getStateAsync(stateId);
                            await this.adapter.setState(stateId, { val: !state?.val, ack: true });
                            return { refresh: 'none' };
                        },
                    },
                    {
                        id: 'delete',
                        description: 'Delete this device',
                        icon: 'delete',
                        confirmation: 'Are you sure you want to delete this device?',
                        handler: async deviceId => {
                            this.log.debug(`Deleting device ${deviceId}...`);
                            await this.adapter.delObjectAsync(deviceId, { recursive: true });
                            return { delete: deviceId };
                        },
                    },
                ],
            });
            this.log.debug(`Loaded device ${device._id}`);

            await delay(500); // Simulate some delay in loading devices
        }

        context.addDevice({
            ...deviceWithoutState,
            actions: [
                {
                    id: 'modify',
                    description: 'Modify this device',
                    icon: 'edit',
                    handler: () => {
                        return {
                            update: {
                                ...deviceWithoutState,
                                name: 'Modified Device',
                                connectionType: 'thread',
                                manufacturer: 'Modified Manufacturer',
                            },
                        };
                    },
                },
                {
                    id: 'long-action',
                    description: 'Simulate a long action',
                    icon: 'lamp',
                    handler: async (_deviceId, context) => {
                        const progress = await context.openProgress('Performing long action...', {
                            label: 'Computing...',
                            indeterminate: true,
                        });
                        for (let i = 1; i <= 100; i++) {
                            await delay(150);
                            if (i > 15) {
                                // Show indeterminate for the first 15%
                                await progress.update({
                                    value: i,
                                    indeterminate: false,
                                    label: `Progress: ${i}%`,
                                });
                            }
                        }
                        await progress.close();
                        return { refresh: 'none' };
                    },
                },
            ],
        });

        this.log.debug('Finished loading devices');
    }

    protected override async getDeviceDetails(id: string): Promise<DeviceDetails<string> | null> {
        await delay(300); // Simulate some delay in loading details
        const obj = await this.adapter.getObjectAsync(id);
        if (!obj) {
            return null;
        }

        const online = await this.adapter.getStateAsync(`${id}.online`);
        const type = await this.adapter.getStateAsync(`${id}.type`);

        return {
            id,
            schema: {
                type: 'panel',
                items: {
                    'obj.common.name': {
                        type: 'text',
                        label: 'Device Name',
                        readOnly: true,
                    },
                    'obj.common.desc': {
                        type: 'text',
                        label: 'Description',
                        readOnly: true,
                    },
                    'obj.native.uuid': {
                        type: 'text',
                        label: 'UUID',
                        readOnly: true,
                    },
                    connType: {
                        type: 'text',
                        label: 'Connection Type',
                        readOnly: true,
                    },
                    online: {
                        type: 'checkbox',
                        label: 'Online',
                        readOnly: true,
                    },
                },
            },
            data: { obj, connType: type?.val, online: online?.val },
        };
    }

    private async addDevice(name?: string): Promise<void> {
        const ts = Date.now();
        const id = `device-${ts}`;
        await this.adapter.extendObject(id, {
            type: 'device',
            common: {
                name: name ?? `Device ${ts}`,
                desc: 'Change the name to see it immediately reflect in the device list',
                statusStates: {
                    onlineId: `${this.adapter.namespace}.${id}.online`,
                },
            },
            native: {
                uuid: randomUUID(),
            },
        });

        await this.adapter.extendObject(`${id}.online`, {
            type: 'state',
            common: {
                name: 'Online',
                type: 'boolean',
                role: 'indicator.reachable',
                read: true,
                write: false,
            },
        });
        await this.adapter.setState(`${id}.online`, { val: true, ack: true });

        await this.adapter.extendObject(`${id}.type`, {
            type: 'state',
            common: {
                name: 'Type',
                type: 'string',
                read: true,
                write: true,
                states: ['lan', 'wifi', 'bluetooth', 'thread', 'z-wave', 'zigbee', 'other'],
            },
        });
        await this.adapter.setState(`${id}.type`, { val: 'other', ack: true });
    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
