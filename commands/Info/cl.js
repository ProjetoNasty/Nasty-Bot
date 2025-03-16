
const config = require('./../../config.json');
const serverId = config.serverId;


module.exports = {
    name: 'cl',
    description: 'Apaga todas as suas mensagens no canal.',
    
    run: async (client, message, args) => {
      

      const messages = await message.channel.messages.fetch();
  
      const userMessages = messages.filter(m => m.author.id === message.author.id);
  
      await message.channel.bulkDelete(userMessages, true);
    },
  };
  