#!/bin/bash

MAIN_DIR=$PWD

# install dev-server
echo "Installing dev-server..."
npm install --global @iobroker/dev-server

npm install

# clone dm-utils if needed
cd $MAIN_DIR/../dm-utils
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
cd $MAIN_DIR/../dm-gui-components
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
cd $MAIN_DIR/../ioBroker.admin
if [ -d ".git" ]; then
    echo "ioBroker.admin already cloned, skipping..."
else
    echo "Cloning ioBroker.admin..."
    sudo chown node:node .
    git clone https://github.com/ioBroker/ioBroker.admin.git .
    npm install
    npm link @iobroker/dm-utils

    cd src-admin
    npm link @iobroker/dm-utils @iobroker/dm-gui-components --force
    cd ..

    npm run build
fi
npm link

# setup dev-server
cd $MAIN_DIR
if [ -d ".dev-server/default" ]; then
    echo "dev-server already set up, skipping..."
else
    echo "Setting up dev-server..."
    dev-server setup default

    echo "Linking ioBroker.admin and dm-utils to dev-server..."
    cd .dev-server/default
    npm i ../../../ioBroker.admin
    npm i ../../../dm-utils
fi

cd $MAIN_DIR
npm link @iobroker/dm-utils
