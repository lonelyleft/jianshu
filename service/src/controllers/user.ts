import * as async from "async";
import * as crypto from "crypto";
//import * as nodemailer from "nodemailer";
import * as passport from "passport";
import * as jwt from 'jsonwebtoken';
import { default as User, UserModel, AuthToken } from "../models/User";
import { Request, Response, NextFunction } from "express";
import { LocalStrategyInfo } from "passport-local";
import { WriteError } from "mongodb";

/**
 * POST /login
 * 用户登陆
 */
export let Login = function (req: Request, res: Response, next: NextFunction) {
    req.checkBody({
        'username': {
            notEmpty: true,
            isLength: {
                options: [{ min: 11, max: 11 }],
                errorMessage: '用户不是合法11位手机号' // Error message for the validator, takes precedent over parameter message
            },
            errorMessage: '用户名不能为空'
        },
        'password': {
            notEmpty: true, // won't validate if field is empty
            isLength: {
                options: [{ min: 6, max: 18 }],
                errorMessage: '密码长度不是6-18位' // Error message for the validator, takes precedent over parameter message
            },
            errorMessage: '密码不能为空' // Error message for the parameter
        },
    })

    req.getValidationResult().then(function (result: any) {
        console.log(result.array())
        console.log(result.mapped())
        if(!result.isEmpty()){
            let message = "未知错误";
            if(result.mapped().username && result.mapped().password){
                message = "用户名和密码不合法"
            }else if(result.mapped().username){
                message = result.mapped().username.msg
            }else if(result.mapped().password){
                message = result.mapped().password.msg
            }
            res.json({
                "meta": {
                    "code": 422,
                    "message": message
                }
            });
            return ;
        }
        User.findOne({
            username: req.body.username
        }).exec((err:any, user: UserModel) => {
            if (err) { return next(err); }
            if (!user) {
                res.json({
                    "meta": {
                        "code": 422,
                        "message": '用户不存在'
                    }
                });
            }
            user.comparePassword(req.body.password, (err:Error, isMatch: boolean) => {
                if (err) {
                    return next(err);
                };
                if (isMatch) {
                    var token = jwt.sign({ username: user.username }, 'jiayishejijianshu', {
                        expiresIn: "7 days"  // token到期时间设置 1000, "2 days", "10h", "7d"
                    });
                    user.token = token;
                    user.save(function (err:any) {
                        if (err) {
                            return next(err);
                        }
                        res.json({
                            "meta": {
                                "code": 200,
                                "message": "登陆成功"
                            },
                            "data": {
                                "token": token,
                                "user": {
                                    "nickname": user.basic.nickname,
                                    "avatar": user.basic.avatar,
                                    "_id": user._id
                                }
                            }
                        });
                    });
                } else {
                    res.json({
                        "meta": {
                            "code": 422,
                            "message": "登陆失败,密码错误!"
                        }
                    });
                }
            });
        });
    }, function (errors: any) {
        console.log(errors)
    });
}

export let CheckNickname = function (req: Request, res: Response, next: NextFunction) {
    req.checkBody({
        'nickname': {
            notEmpty: true,
            isLength: {
                options: [{ min: 2, max: 10 }],
                errorMessage: '昵称长度不是2-10位' // Error message for the validator, takes precedent over parameter message
            },
            errorMessage: '昵称不能为空'
        }
    });
    req.getValidationResult().then(function (result: any) {
        console.log(result.array())
        console.log(result.mapped())
        if (!result.isEmpty()) {
            let message = "未知错误";
            if (result.mapped().nickname) {
                message = result.mapped().nickname.msg
            }
            res.json({
                "meta": {
                    "code": 422,
                    "message": message
                }
            });
            return;
        }
        User.findOne({
            'basic.nickname': req.body.nickname
        }).exec((err: any, user: UserModel) => {
            if (err) {
                return next(err);
            };
            if (!user) {
                res.json({
                    "meta": {
                        "code": 200,
                        "message": "可以注册"
                    }
                });
            } else {
                res.json({
                    "meta": {
                        "code": 422,
                        "message": "已经被注册"
                    }
                });
            }
        });
    });
}

export let CheckUsername = function (req: Request, res: Response, next: NextFunction) {
    req.checkBody({
        'username': {
            notEmpty: true,
            isLength: {
                options: [{ min: 11, max: 11 }],
                errorMessage: '用户不是合法11位手机号' // Error message for the validator, takes precedent over parameter message
            },
            errorMessage: '用户名不能为空'
        }
    });
    req.getValidationResult().then(function (result: any) {
        console.log(result.array())
        console.log(result.mapped())
        if (!result.isEmpty()) {
            let message = "未知错误";
            if (result.mapped().username) {
                message = result.mapped().username.msg
            }
            res.json({
                "meta": {
                    "code": 422,
                    "message": message
                }
            });
            return;
        }
        User.findOne({
            'username': req.body.username
        }).exec((err: any, user: UserModel) => {
            if (err) {
                return next(err);
            };
            if (!user) {
                res.json({
                    "meta": {
                        "code": 200,
                        "message": "可以注册"
                    }
                });
            } else {
                res.json({
                    "meta": {
                        "code": 422,
                        "message": "已经被注册"
                    }
                });
            }
        });
    });
}

/**
 * POST /register
 * 用户注册
 */
export let Register = function (req: Request, res: Response, next: NextFunction) {
    req.checkBody({
        'nickname': {
            notEmpty: true,
            isLength: {
                options: [{ min: 2, max: 10 }],
                errorMessage: '昵称长度不是2-10位' // Error message for the validator, takes precedent over parameter message
            },
            errorMessage: '昵称不能为空'
        },
        'username': {
            notEmpty: true,
            isLength: {
                options: [{ min: 11, max: 11 }],
                errorMessage: '用户不是合法11位手机号' // Error message for the validator, takes precedent over parameter message
            },
            errorMessage: '用户名不能为空'
        },
        'password': {
            notEmpty: true, // won't validate if field is empty
            isLength: {
                options: [{ min: 6, max: 18 }],
                errorMessage: '密码长度不是6-18位' // Error message for the validator, takes precedent over parameter message
            },
            errorMessage: '密码不能为空' // Error message for the parameter
        }
    });

    req.getValidationResult().then(function (result: any) {
        console.log(result.array())
        console.log(result.mapped())
        if(!result.isEmpty()){
            let message = "未知错误";
            if(result.mapped().nickname && result.mapped().username && result.mapped().password){
                message = "昵称，用户名和密码不合法"
            }else if(result.mapped().username){
                message = result.mapped().username.msg
            }else if(result.mapped().password){
                message = result.mapped().password.msg
            }else if(result.mapped().nickname){
                message = result.mapped().nickname.msg
            }
            res.json({
                "meta": {
                    "code": 422,
                    "message": message
                }
            });
            return ;
        }
        User.findOne({
            $or: [
                {
                    username: req.body.username
                },
                {
                    'basic.nickname': req.body.nickname
                }
            ]
        }).exec((err:any, user: UserModel) => {
            if (err) {
                return next(err);
            };
            if(!user){
                var newUser = new User({
                    basic: {
                        nickname: req.body.nickname
                    },
                    username: req.body.username,
                    password: req.body.password
                });
                // 保存用户账号
                newUser.save((err) => {
                    if (err) {
                        return next(err);
                    }
                    (req as any).login();
                    res.json({
                        code: 0,
                        message: "ok",
                        data: {
                            message: '成功创建新用户!'
                        }
                    });
                });
            } else {
                res.json({
                    "meta": {
                        "code": 422,
                        "message": "已经被注册"
                    }
                });
            }
        });
        /*
        // 保存用户账号
        newUser.save((err) => {
            if (err) {
                res.json({
                    code: 110,
                    message: "用户已经注册",
                    data: {}
                });
            }
            res.json({
                code: 0,
                message: "ok",
                data: {
                    message: '成功创建新用户!'
                }
            });
        });
*/
        /*User.findOne({
            username: req.body.username
        }).exec((err:any, user: UserModel) => {
            if (err) { return next(err); }
            if (!user) {
                res.json({
                    "meta": {
                        "code": 422,
                        "message": '用户不存在'
                    }
                });
            }
            user.comparePassword(req.body.password, (err:Error, isMatch: boolean) => {
                if (err) {
                    return next(err);
                };
                if (isMatch) {
                    var token = jwt.sign({ username: user.username }, 'jiayishejijianshu', {
                        expiresIn: "7 days"  // token到期时间设置 1000, "2 days", "10h", "7d"
                    });
                    user.token = token;
                    user.save(function (err:any) {
                        if (err) {
                            return next(err);
                        }
                        res.json({
                            "meta": {
                                "code": 200,
                                "message": "登陆成功"
                            },
                            "data": {
                                "token": token,
                                "user": {
                                    "nickname": user.basic.nickname,
                                    "avatar": user.basic.avatar,
                                    "_id": user._id
                                }
                            }
                        });
                    });
                } else {
                    res.json({
                        "meta": {
                            "code": 422,
                            "message": "登陆失败,密码错误!"
                        }
                    });
                }
            });
        });*/
    }, function (errors: any) {
        console.log(errors)
    });
}

/**
 * GET /logout
 * 退出登陆
 */
export let Logout = function (req: Request, res: Response, next: NextFunction) {
    console.log((req as any).isAuthenticated())
    if((req as any).isAuthenticated()){
        User.update({_id: (req as any).user._id}, { token: undefined})
            .exec((err:any, user: UserModel) => {
            if (err) { return next(err); }
            if (!user) {
                res.json({
                    "meta": {
                        "code": 422,
                        "message": '用户不存在'
                    }
                });
                return ;
            }
            (req as any).logout();
            res.json({
                "meta": {
                    "code": 200,
                    "message": "退出成功"
                }
            });
        });
    }
}

/**
 * GET /user/:id
 * 获取一个用户主页
 */
export let GetUser = function (req: Request, res: Response, next: NextFunction) {

}