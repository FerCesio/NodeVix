#!/bin/bash
set -e
cd ./app
railway up --service app
cd ../api
railway up --service api
