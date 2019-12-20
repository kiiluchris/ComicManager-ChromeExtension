#!/bin/bash


CMD=$1
case $CMD in
    run|sign) echo "Running \"web-ext $CMD";;
    *) echo "$CMD is not a valid command"; exit 1;;
esac

DIR=$(pwd)

cd ~
read -r API_KEY API_SECRET <<< $(node -e "const {apiKey, apiSecret} = require('./.web-ext-config').sign; console.log(apiKey + ' ' + apiSecret)")
cd $DIR



web-ext $CMD --api-key $API_KEY --api-secret $API_SECRET

