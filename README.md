# qp-assessment

TO setup the project kindly follow the procedure:

1) run command: npm i
2) In .env file set credentials of development DB as per yours and create a schema with name as "qp-assessment"
3) run command: npm run build
4) run command: npm start
5) Server will start listening on port localhost:4010
6) Stop the server : Ctrl+c
7) run the follwing command to make user and roles and language file :-
        npx npm-check-updates
        npx sequelize db:seed --seed languages.js --config ./dist/config/config.js
        npx sequelize db:seed --seed user-and-roles.js --config ./dist/config/config.js
8)  run command: npm start 
Server will start listening on port localhost:4010 

For Apis documentation hit the url : localhost:4010/documentation

#admin credentials for login using login api :- 
    email:admin@qp.com
    username:admin@qp.com