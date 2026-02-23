"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var DmDemoDeviceManagement_exports = {};
__export(DmDemoDeviceManagement_exports, {
  DmDemoDeviceManagement: () => DmDemoDeviceManagement
});
module.exports = __toCommonJS(DmDemoDeviceManagement_exports);
var import_dm_utils = require("@iobroker/dm-utils");
var import_node_crypto = require("node:crypto");
const deviceWithoutState = {
  id: "new-device",
  name: "Device without state",
  connectionType: "other",
  status: {
    connection: "disconnected"
  },
  identifier: "n/a"
};
class DmDemoDeviceManagement extends import_dm_utils.DeviceManagement {
  async getInstanceInfo() {
    var _a;
    const info = await super.getInstanceInfo();
    info.identifierLabel = "UUID";
    (_a = info.actions) != null ? _a : info.actions = [];
    info.actions.push(
      {
        id: "add-device",
        title: "Add Device",
        icon: "add",
        inputBefore: {
          label: "New device name",
          type: "text"
        },
        handler: async (context, options) => {
          var _a2;
          await this.addDevice((_a2 = options == null ? void 0 : options.value) != null ? _a2 : "Unnamed Device");
          return { refresh: true };
        }
      },
      {
        id: "add-many",
        title: "Add Many Devices",
        icon: "forward",
        inputBefore: {
          label: "Number of new devices",
          type: "number",
          min: 0,
          max: 100,
          step: 1
        },
        handler: async (context, options) => {
          const count = Number((options == null ? void 0 : options.value) || 0);
          if (count == 0) {
            await context.showMessage("Please enter a number greater than 0");
            return { refresh: false };
          }
          const confirmed = await context.showConfirmation(`Are you sure you want to add ${count} devices?`);
          if (!confirmed) {
            return { refresh: false };
          }
          const progress = await context.openProgress("Adding devices...", { value: 0 });
          for (let i = 1; i <= count; i++) {
            await delay(200);
            await this.addDevice();
            await progress.update({
              value: i / count * 100,
              label: `Added ${i} of ${count} devices`
            });
          }
          await progress.close();
          return { refresh: true };
        }
      }
    );
    return info;
  }
  async loadDevices(context) {
    this.log.debug(`Loading devices...`);
    const devices = await this.adapter.getDevicesAsync();
    this.log.debug(`Found ${devices.length} devices`);
    context.setTotalDevices(devices.length + 1);
    this.log.debug(`Adding devices, total count: ${devices.length + 1}`);
    for (const device of devices) {
      context.addDevice({
        id: device._id.replace(/^.+\./, ""),
        identifier: device.native.uuid,
        name: {
          objectId: device._id,
          property: "common.name"
        },
        connectionType: {
          stateId: `${device._id}.type`
        },
        status: {
          connection: {
            stateId: `${device._id}.online`,
            mapping: {
              true: "connected",
              false: "disconnected"
            }
          }
        },
        actions: [
          {
            id: "info",
            description: "Show device info",
            icon: "info",
            url: "https://www.iobroker.dev/adapter/UncleSamSwiss/ioBroker.dm-demo"
          },
          {
            id: "toggle-online",
            description: "Toggle online status",
            icon: "socket",
            handler: async (deviceId) => {
              const stateId = `${deviceId}.online`;
              const state = await this.adapter.getStateAsync(stateId);
              await this.adapter.setState(stateId, { val: !(state == null ? void 0 : state.val), ack: true });
              return { refresh: "none" };
            }
          },
          {
            id: "delete",
            description: "Delete this device",
            icon: "delete",
            confirmation: "Are you sure you want to delete this device?",
            handler: async (deviceId) => {
              this.log.debug(`Deleting device ${deviceId}...`);
              await this.adapter.delObjectAsync(deviceId, { recursive: true });
              return { delete: deviceId };
            }
          }
        ]
      });
      this.log.debug(`Loaded device ${device._id}`);
      await delay(500);
    }
    context.addDevice({
      ...deviceWithoutState,
      actions: [
        {
          id: "modify",
          description: "Modify this device",
          icon: "edit",
          handler: () => {
            return { update: { ...deviceWithoutState, name: "Modified Device" } };
          }
        }
      ]
    });
    this.log.debug("Finished loading devices");
  }
  async addDevice(name) {
    const ts = Date.now();
    const id = `device-${ts}`;
    await this.adapter.extendObject(id, {
      type: "device",
      common: {
        name: name != null ? name : `Device ${ts}`,
        desc: "Change the name to see it immediately reflect in the device list",
        statusStates: {
          onlineId: `${this.adapter.namespace}.${id}.online`
        }
      },
      native: {
        uuid: (0, import_node_crypto.randomUUID)()
      }
    });
    await this.adapter.extendObject(`${id}.online`, {
      type: "state",
      common: {
        name: "Online",
        type: "boolean",
        role: "indicator.reachable",
        read: true,
        write: false
      }
    });
    await this.adapter.setState(`${id}.online`, { val: true, ack: true });
    await this.adapter.extendObject(`${id}.type`, {
      type: "state",
      common: {
        name: "Type",
        type: "string",
        read: true,
        write: true,
        states: ["lan", "wifi", "bluetooth", "thread", "z-wave", "zigbee", "other"]
      }
    });
    await this.adapter.setState(`${id}.type`, { val: "other", ack: true });
  }
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DmDemoDeviceManagement
});
//# sourceMappingURL=DmDemoDeviceManagement.js.map
