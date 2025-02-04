'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    let initializations = await queryInterface.sequelize.query("select id from languages",{type: queryInterface.sequelize.QueryTypes.SELECT});
    if(initializations.length==0){
      let languages = await queryInterface.bulkInsert('languages',[
        {name:'English',status:1,code:'en',is_default:true,created_at: new Date(), updated_at: new Date()}
      ])
      if(languages){
          console.log("System language initialized successfully")
      }
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
