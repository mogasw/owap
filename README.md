# Open Workflow Automation Protocol (OWAP)

## Abstract 

This repository contains a draft description and reference implementation of a network protocol for the automation of data collection and processing workflows for marine geological surveys. 

It provides a standardized way for open source, internally developed, and commercial software applications to share information about events that happen during normal operations (e.g. a file is ready for processing) allowing each application to react accordingly.

A typical use case is the automation of processing workflows on board of autonomous vehicles, where there can not be a human operator controlling the post-processing software tools.

## Structure of the repository

* docs/protocol.md - description of the protocol (DRAFT)
* src/nodejs/broker - reference implementation of the broker service 
* src/nodejs/client - reference implementation of the client library


## Copyright notice

Copyright (c) 2023 Moga Software s.r.l. and all the people identified as the authors in the documentation and / or source code. All rights reserved.