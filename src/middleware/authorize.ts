import { type NextFunction, type Response } from "express";
import { type RequestWithAuth } from "../types.js";

type Operation = 'delete' | 'create' | 'edit' | 'read';
type Scope = 'any' | 'own';
type Resource = 'accounts' | 'products';

type Permission = `${Operation}:${Scope}:${Resource}`;
type Role = 'user' | 'moderator' | 'guest';

const PERMISSIONS: Partial<Record<Permission, Role[]>> = {
    'create:any:accounts': ['moderator'],
    'edit:any:accounts':   ['moderator'],
    'read:any:accounts':   ['moderator'],
    'delete:any:accounts': ['moderator'],

    'create:own:accounts': ['user', 'moderator'],
    'edit:own:accounts':   ['user', 'moderator'],
    'read:own:accounts':   ['user', 'moderator'],
    'delete:own:accounts': ['user', 'moderator'],

    'create:own:products': ['user', 'moderator'],
    'edit:own:products':   ['user', 'moderator'],
    'delete:own:products': ['user', 'moderator'],
    'read:any:products':   ['user', 'moderator', 'guest'],
};


export default function authorize(requiredPermissions: Permission[]) {
    return (request: RequestWithAuth, response: Response, next: NextFunction) => {
        if (!request.user) {
            return response.status(401).json({ error: "нужно авторизироваться" });
        }

        const role = request.user.role as Role;

        const hasRights = requiredPermissions.some(permission => {
            const allowedRoles = PERMISSIONS[permission]; 
            return allowedRoles && allowedRoles.includes(role);
        });

        if (!hasRights) {
            return response.status(403).json({ error: "Недостаточно прав" }); 
        }

        next();
    };
}
