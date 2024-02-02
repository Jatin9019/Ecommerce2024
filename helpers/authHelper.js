import bcrypt from 'bcrypt';

export const hashPassowrd = async(password) => {
    try{
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password,saltRounds);
        return hashedPassword;
    }catch(error){
        console.log(error);
    }
}

export const camparePassword = async(password,hashedPassword) => {
    return bcrypt.compare(password,hashedPassword);
}