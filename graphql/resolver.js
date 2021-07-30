import validator from 'validator';

import generateToken from '../utils/generateToken.js'
import User from '../models/user.js';

export default {
    createUser: async function({ userInput }, req) {
        const { name, email, password } = userInput

        const errors = [];
        if (!validator.isEmail(email)) {
            errors.push({ message: 'E-mail is invalid.' })
        }

        if (validator.isEmpty(password) || !validator.isLength(password, { min:5 })) {
            errors.push({ message: 'Password to short.' })
        }

        if (errors.length > 0) {
            const error = new Error('Invalid input.')
            error.data = errors
            error.code = 422
            throw error
        }

        const userExists = await User.findOne({ email })
        if (userExists) {
            throw new Error('User already exists.')
        } 

        const user = await User.create({
            name,
            email,
            password
        })

        return { ...user._doc, _id: user._id.toString() };
    },
    login: async function({ email, password }) {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id)
            return  { token, userId: user._id.toString() }
        }

        const error = new Error('Invalid credentials.');
        error.code = 401;
        throw error;
    }, 
}