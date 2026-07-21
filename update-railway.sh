#!/bin/bash
set -e
cd ./app
railway up --service app --detach
cd ../api
railway up --service api --detach
