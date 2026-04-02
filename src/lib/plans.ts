export type PlanType = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
  products: number;
  stores: number;
  pixels: number;
  webhooks: number;
  orderBumps: number;
  monthlyViews: number;
  shippingOptions: number;
}

export interface PlanInfo {
  name: string;
  type: PlanType;
  description: string;
  limits: PlanLimits;
  badge: string;
  color: string;
}

const UNLIMITED = 999999;

export const PLANS: Record<PlanType, PlanInfo> = {
  free: {
    name: 'Free',
    type: 'free',
    description: 'Para começar a testar a plataforma',
    badge: 'Gratuito',
    color: 'muted',
    limits: {
      products: 3,
      stores: 1,
      pixels: 2,
      webhooks: 1,
      orderBumps: 2,
      monthlyViews: 200,
      shippingOptions: 2,
    },
  },
  pro: {
    name: 'Pro',
    type: 'pro',
    description: 'Para vendedores em crescimento',
    badge: 'Pro',
    color: 'void-cyan',
    limits: {
      products: 25,
      stores: 5,
      pixels: 10,
      webhooks: 5,
      orderBumps: 10,
      monthlyViews: UNLIMITED,
      shippingOptions: 10,
    },
  },
  enterprise: {
    name: 'Enterprise',
    type: 'enterprise',
    description: 'Sem limites, suporte prioritário',
    badge: 'Enterprise',
    color: 'void-purple',
    limits: {
      products: UNLIMITED,
      stores: UNLIMITED,
      pixels: UNLIMITED,
      webhooks: UNLIMITED,
      orderBumps: UNLIMITED,
      monthlyViews: UNLIMITED,
      shippingOptions: UNLIMITED,
    },
  },
};

export const isUnlimited = (value: number) => value >= UNLIMITED;

export const formatLimit = (value: number) => isUnlimited(value) ? '∞' : value.toString();
