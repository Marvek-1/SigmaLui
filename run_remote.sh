#!/usr/bin/env bash
ssh -o BatchMode=yes root@31.97.180.251 'curl -skI https://127.0.0.1/ | head -n 5; curl -sI http://127.0.0.1/ | head -n 5'

