#!/bin/bash

# install dev-server
echo "Installing dev-server..."
npm install --global @iobroker/dev-server

# clone dm-utils if needed
cd ../dm-utils
if [ -d ".git" ]; then
    echo "dm-utils already cloned, skipping..."
else
    echo "Cloning dm-utils..."
    sudo chown node:node .
    git clone https://github.com/ioBroker/dm-utils.git .
fi

# clone dm-gui-components if needed
cd ../dm-gui-components
if [ -d ".git" ]; then
    echo "dm-gui-components already cloned, skipping..."
else
    echo "Cloning dm-gui-components..."
    sudo chown node:node .
    git clone https://github.com/ioBroker/dm-gui-components.git .
fi