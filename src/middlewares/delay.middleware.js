const delayMiddleware = (req,res,next)=>{
    setTimeout(() => {
        next();
    },100);
}
module.exports= delayMiddleware