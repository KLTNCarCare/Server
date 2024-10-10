const connections = {};

const addConnection = (id, conn) => {
  connections[id] = conn;
};
const removeConnection = (id) => {
  delete connections[id];
};
const sendMessage = (id, messageType, messageContent) => {
  if (connections[id]) {
    connections[id].write(
      JSON.stringify({
        mess_type: messageType,
        mess_content: messageContent,
      })
    );
  } else {
    console.log(`Connection with ID ${id} does not exist`);
  }
};
const sendMessageAllStaff = (type, content) => {
  for (let id in connections) {
    sendMessage(id, type, content);
  }
};
module.exports = {
  addConnection,
  removeConnection,
  sendMessage,
  sendMessageAllStaff,
};
