#!/bin/bash

# install dev-server
echo "Installing dev-server..."
npm install --global @iobroker/dev-server

npm install

if [ -d ".dev-server/default" ]; then
    echo "dev-server already set up, skipping..."
else
    echo "Setting up dev-server..."
    dev-server setup default
fi

MAIN_DIR=$PWD

# clone dm-utils if needed
cd ../dm-utils
if [ -d ".git" ]; then
    echo "dm-utils already cloned, skipping..."
else
    echo "Cloning dm-utils..."
    sudo chown node:node .
    git clone https://github.com/ioBroker/dm-utils.git .
    npm install
    npm run build
fi
npm link

# clone dm-gui-components if needed
cd ../dm-gui-components
if [ -d ".git" ]; then
    echo "dm-gui-components already cloned, skipping..."
else
    echo "Cloning dm-gui-components..."
    sudo chown node:node .
    git clone https://github.com/ioBroker/dm-gui-components.git .
    npm install
    npm link @iobroker/dm-utils
    npm run build
fi
npm link

# clone ioBroker.admin if needed
cd ../ioBroker.admin
if [ -d ".git" ]; then
    echo "ioBroker.admin already cloned, skipping..."
else
    echo "Cloning ioBroker.admin..."
    sudo chown node:node .
    git clone https://github.com/ioBroker/ioBroker.admin.git .
    npm install
    npm link @iobroker/dm-utils

    cd src-admin
    npm link @iobroker/dm-utils
    npm link @iobroker/dm-gui-components
    cd ..

    npm run build
fi
npm link

cd $MAIN_DIR
npm link @iobroker/dm-utils

cd .dev-server/default
npm link iobroker.admin
