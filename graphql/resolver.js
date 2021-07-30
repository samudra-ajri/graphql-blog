import User from '../models/user.js';

export default {
    createUser: async function({ userInput }, req) {
        const { name, email, password } = userInput

        const userExists = await User.findOne({ email })
        if (userExists) {
            throw new Error('User already exists')
        } 

        const user = await User.create({
            name,
            email,
            password
        })

        return { ...user._doc, _id: user._id.toString() };
    }
}