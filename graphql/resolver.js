import validator from 'validator';

import generateToken from '../utils/generateToken.js'
import User from '../models/user.js';
import Post from '../models/post.js';

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
    createPost: async ({ postInput }, req) => {
        const { title, imageUrl, content } = postInput
        
        if (!req.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }
        
        const errors = [];
        if (validator.isEmpty(title) || !validator.isLength(title, { min:6 })) {
            errors.push({ message: 'Title to short.' })
        }

        if (!validator.isURL(imageUrl)) {
            errors.push({ message: 'Image URL invalid.' })
        }

        if (validator.isEmpty(content) || !validator.isLength(content, { min:10 })) {
            errors.push({ message: 'Content to short.' })
        }

        if (errors.length > 0) {
            const error = new Error('Invalid input.')
            error.data = errors
            error.code = 422
            throw error
        }

        const user = await User.findById(req.userId)
        if (!user) {
            const error = new Error('Invalid user.')
            error.code = 401;
            throw error;
        }

        const post = await Post.create({
            title,
            imageUrl,
            content,
            creator: user
        })
        user.posts.push(post);
        await user.save();

        return { ...post._doc, _id: post._id.toString() };
    },
    posts: async function({ page }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated!')
            error.code = 401
            throw error
        }

        if (!page) {
            page = 1
        }

        const perPage = 2;
        const totalPosts = await Post.find().countDocuments()
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('creator')

        return {
            posts: posts.map(post => {
                return {
                    ...post._doc,
                    _id: post._id.toString()
                }
            }),
            totalPosts: totalPosts
        };
    },
}