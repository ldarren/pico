pico node.js game server framework. it is aim to be a simple and fast game server engine

## Installation
Recommended folder structure

    -+
     +-pico
     +-YOUR PROJECT
       |
       +-actions
       +-models
       +-config
       +-index.js

### Setup configuration file

### Setup actions
all actions script files should be resided in actions folder, create an index.js at the folder to load all actions. simplest way load all is as follow:

    module.exports = [
        require('./action1'),
        require('./action2')
    ];

### Setup models

## Run
  node index.js -c cfg/dev
