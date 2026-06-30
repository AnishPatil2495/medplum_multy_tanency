-- Initialize databases for both applications and Medplum server
CREATE DATABASE medplum_poc_app1;
CREATE DATABASE medplum_poc_app2;
CREATE DATABASE medplum;

-- Grant permissions to the medplum user
GRANT ALL PRIVILEGES ON DATABASE medplum_poc_app1 TO medplum;
GRANT ALL PRIVILEGES ON DATABASE medplum_poc_app2 TO medplum;
GRANT ALL PRIVILEGES ON DATABASE medplum TO medplum;
