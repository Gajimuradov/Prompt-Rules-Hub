import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import {
  composeContextRequestSchema,
  createRuleSchema,
  updateRuleSchema
} from '../src/shared/ruleSchema.js';
import { composeContext } from './contextComposer.js';
import { ApiError } from './errors.js';
import { createRule, deleteRule, readRules, updateRule } from './storage.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/api/rules', async (_request, response, next) => {
  try {
    const rules = await readRules();
    response.json(
      [...rules].sort((firstRule, secondRule) =>
        secondRule.updatedAt.localeCompare(firstRule.updatedAt)
      )
    );
  } catch (error) {
    next(error);
  }
});

app.get('/api/rules/:id', async (request, response, next) => {
  try {
    const rules = await readRules();
    const rule = rules.find((candidateRule) => candidateRule.id === request.params.id);

    if (!rule) {
      throw new ApiError(404, 'Rule not found');
    }

    response.json(rule);
  } catch (error) {
    next(error);
  }
});

app.post('/api/rules', async (request, response, next) => {
  try {
    const input = createRuleSchema.parse(request.body);
    const rule = await createRule(input);
    response.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/rules/:id', async (request, response, next) => {
  try {
    const input = updateRuleSchema.parse(request.body);
    const rule = await updateRule(request.params.id, input);
    response.json(rule);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/rules/:id', async (request, response, next) => {
  try {
    await deleteRule(request.params.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/api/context/compose', async (request, response, next) => {
  try {
    const input = composeContextRequestSchema.parse(request.body);
    const rules = await readRules();
    const composedContext = composeContext(rules, input.ruleIds, {
      includeMetadata: input.includeMetadata
    });

    response.json(composedContext);
  } catch (error) {
    next(error);
  }
});

app.use((_request, _response, next) => {
  next(new ApiError(404, 'Route not found'));
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Validation failed',
      issues: error.flatten()
    });
    return;
  }

  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
    return;
  }

  console.error(error);
  response.status(500).json({ message: 'Unexpected server error' });
});

app.listen(port, () => {
  console.log(`Prompt Rules Hub API is running on http://localhost:${port}`);
});
