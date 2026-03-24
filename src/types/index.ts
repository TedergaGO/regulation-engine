import { Request } from 'express';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  logo_data?: Buffer;
  logo_mimetype?: string;
  settings: Record<string, any>;
  plan: string;
  is_active: boolean;
  created_at: Date;
}

export interface User {
  id: number;
  tenant_id: number;
  username: string;
  full_name: string;
  email?: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  created_at: Date;
}

export interface JwtPayload {
  sub: number;
  username: string;
  fullName: string;
  role: string;
  tenantId: number;
  iat?: number;
  exp?: number;
}

export interface Standard {
  id: string;
  tenant_id: number;
  name: string;
  short_name?: string;
  category?: string;
  version?: string;
  published_by?: string;
  description?: string;
  ref_format?: string;
  control_count: number;
  status: string;
  color?: string;
  icon?: string;
  generated_at?: Date;
  created_at?: Date;
}

export interface Control {
  id?: number;
  tenant_id: number;
  standard_id: string;
  ref_no: string;
  category?: string;
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  keywords: string[];
  created_at?: Date;
}

export interface ProcedureStep {
  stepNo: number;
  title: string;
  description: string;
  responsible?: string;
  inputs?: string[];
  outputs?: string[];
}

export interface Responsibility {
  role: string;
  duties: string;
}

export interface PolicyDocument {
  documentTitle: string;
  purpose: string;
  scope: string;
  policyStatement: string;
  procedures: ProcedureStep[];
  responsibilities: Responsibility[];
  measurementCriteria: string[];
  relatedDocuments: string[];
  exceptions: string;
  compliance: string;
  reviewPeriod: string;
}

export interface PolicyVersion {
  id?: number;
  policy_id?: number;
  version: string;
  created_at?: Date | string;
  created_by: string;
  created_by_user_id?: number;
  note?: string;
  document: PolicyDocument;
}

export interface Policy {
  id?: number;
  tenant_id: number;
  standard_id: string;
  ref_no: string;
  control_title?: string;
  current_version: string;
  last_modified_by?: string;
  last_modified_at?: Date;
  created_at?: Date;
  versions?: PolicyVersion[];
}

export interface TopicTaxonomy {
  slug: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

export interface IndustryDomain {
  id: string;
  tenant_id: number;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  primary_standards: string[];
  supporting_standards: string[];
  sort_order: number;
}

// Express augmentation
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenantId?: number;
    }
  }
}

export interface AuthRequest extends Request {
  user: JwtPayload;
  tenantId: number;
}
