import type { Request, Response } from 'express';
import { UserRepository } from '../repositories/UserRepository.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  role: z.enum(['admin', 'helper', 'auditor', 'user']),
  password: z.string().min(4).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export class UserController {
  private repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
  }

  listAll = async (req: Request, res: Response) => {
    try {
      const users = await this.repository.listAll();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar responsáveis' });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { name, email, role, password } = UserSchema.parse(req.body);
      
      const existing = await this.repository.findByEmail(email);
      if (existing) return res.status(400).json({ error: 'E-mail já cadastrado' });

      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      } else {
        // Default password for new members if not specified: '123456'
        passwordHash = await bcrypt.hash('123456', 10);
      }
      
      const id = await this.repository.create(name, email, role, passwordHash);
      res.status(201).json({ id, name, email, role });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      } else {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar responsável' });
      }
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = LoginSchema.parse(req.body);
      const user = await this.repository.findByEmail(email);
      
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      if (!user.password_hash) {
        return res.status(401).json({ error: 'Usuário sem senha definida.' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token
      });
    } catch (error) {
       if (error instanceof z.ZodError) {
         res.status(400).json({ error: 'Dados incompletos' });
       } else {
         console.error('Login error:', error);
         res.status(500).json({ error: 'Falha na autenticação interna' });
       }
    }
  }

  delete = async (req: Request, res: Response) => {
    // Audit protection later
    try {
      const { id } = req.params;
      await this.repository.delete(id as string);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir responsável' });
    }
  };
}
