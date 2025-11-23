#!/bin/bash
# Start PostGIS database container
docker run --name munkith-db -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=munkith -p 5432:5432 -d postgis/postgis
