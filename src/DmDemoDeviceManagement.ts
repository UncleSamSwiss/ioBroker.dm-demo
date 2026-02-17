import { type DeviceLoadContext, DeviceManagement, type InstanceDetails } from '@iobroker/dm-utils';
import { randomUUID } from 'node:crypto';
import type { DmDemo } from './main';

/**
 * Device management class for the dm-demo adapter.
 */
export class DmDemoDeviceManagement extends DeviceManagement<DmDemo> {
    protected override async getInstanceInfo(): Promise<InstanceDetails> {
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
                    await this.addDevice(options?.input ?? 'Unnamed Device');

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
                    const count = Number(options?.input || 0);
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
        );
        return info;
    }

    protected override async loadDevices(context: DeviceLoadContext<string>): Promise<void> {
        const devices = await this.adapter.getDevicesAsync();
        context.setTotalDevices(devices.length + 1);

        for (const device of devices) {
            context.addDevice({
                id: device._id,
                identifier: device.native.uuid,
                name: {
                    objectId: device._id,
                    property: 'common.name',
                },

                enabled: true,
            });

            await delay(500); // Simulate some delay in loading devices
        }

        context.addDevice({
            id: 'new-device',
            name: 'Device without state',
            enabled: false,
        });
    }

    private async addDevice(name?: string): Promise<void> {
        const ts = Date.now();
        const id = `device-${ts}`;
        await this.adapter.extendObject(id, {
            type: 'device',
            common: {
                name: name ?? `Device ${ts}`,
                desc: 'Change the name to see it immediately reflect in the device list',
            },
            native: {
                uuid: randomUUID(),
            },
        });
    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
