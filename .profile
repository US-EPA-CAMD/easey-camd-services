#!/bin/bash
FILENAME=data-dictionary.json
URL=https://${EASEY_API_GATEWAY_HOST}/content-mgmt/${FILENAME}
echo "Retrieving Data Dictionary from ${URL}"
wget -O ./${FILENAME} ${URL}
