const LastId = require("../models/lastId.model")

const generateID = async (modelCode) => {
try {
    let lastId = await LastId.findOne({ modelCode });
    if(!lastId){
    lastId= await LastId.create({modelCode:modelCode,lastId:0});
    }
    lastId.lastId += 1;
    await LastId.findOneAndUpdate({modelCode},{lastId:lastId.lastId});

    if(lastId.lastId <10) return lastId.modelCode +"000"+lastId.lastId;
    if(lastId.lastId <100) return lastId.modelCode +"00"+lastId.lastId;
    if(lastId.lastId <1000) return lastId.modelCode +"0"+lastId.lastId;
    return lastId.modelCode + lastId.lastId; 
} catch (error) {
    console.log("Error at generateID: ", error);
    return null;
}
};
const decreaseLastID = async (modelCode) => {
    try {
        let lastId = await LastId.findOne({ modelCode });
        if(!lastId) return false;
        await LastId.findOneAndUpdate({modelCode},{lastId:lastId.lastId-1});
        return true;
    }catch(error){
        console.log("Error at decreaseID: ", error);
        return false;
    }
}
module.exports = {
    generateID,
decreaseLastID
};
