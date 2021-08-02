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
    posts: async function({ page=1 }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated!')
            error.code = 401
            throw error
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
    post: async function({ id }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated!')
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(id).populate('creator')
        if (!post) {
            const error = new Error('No post found!')
            error.code = 404;
            throw error;
        }
        return {
            ...post._doc,
            _id: post._id.toString()
        }
    },
    updatePost: async function({ id, postInput }, req) {
        const { title, imageUrl, content } = postInput
        
        if (!req.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }

        const post = await Post.findById(id).populate('creator');
        if (!post) {
            const error = new Error('No post found!')
            error.code = 404
            throw error
        }

        if (post.creator._id.toString() !== req.userId.toString()) {
            const error = new Error('Not authorized!')
            error.code = 403
            throw error
        }

        const errors = [];
        if (
            validator.isEmpty(title) ||
            !validator.isLength(title, { min: 5 })
        ) {
            errors.push({ message: 'Title is invalid.' })
        }
        if (
            validator.isEmpty(content) ||
            !validator.isLength(content, { min: 5 })
        ) {
            errors.push({ message: 'Content is invalid.' })
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input.')
            error.data = errors
            error.code = 422
            throw error
        }
            post.title = title
            post.content = content
            if (imageUrl !== 'undefined') {
            post.imageUrl = imageUrl
        }

        const updatedPost = await post.save()
        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString()
        }
    },
    deletePost: async ({ id }, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated!')
            error.code = 401
            throw error
        }
        
        const postExists = await Post.findById(id)
        if (!postExists) {
            throw new Error('Post not found.')
            error.code = 404;
            throw error;
        }

        if (postExists.creator.toString() !== req.userId.toString()) {
            const error = new Error('Not authorized!');
            error.code = 403;
            throw error;
        }

        await Post.findByIdAndRemove(id)
        const user = await User.findById(req.userId);
        user.posts.pull(id);
        await user.save();

        return true
    },
    user: async ({ status }, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated!')
            error.code = 401
            throw error
        }

        const user = await User.findById(req.userId)
        if (!user) {
            const error = new Error('No user found!')
            error.code = 404;
            throw error;
        }

        return { ...user._doc, _id: user.id.toString() }
    },
    updateStatus: async ({ status }, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated!')
            error.code = 401
            throw error
        }

        const user = await User.findById(req.userId)
        if (!user) {
            const error = new Error('No user found!')
            error.code = 404
            throw error
        }
        user.status = status
        await user.save()
        
        return { ...user._doc, _id: user._id.toString() }
    }
}