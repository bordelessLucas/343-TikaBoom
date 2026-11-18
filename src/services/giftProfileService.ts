import { supabase, auth } from '../lib/supabase';
import type { ClothingSize, StreamerGiftProfile } from '../types/models';

export type GiftProfileInput = {
  fullName: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  shoeSize: string;
  heightCm?: number | null;
  weightKg?: number | null;
  clothingSize?: ClothingSize | null;
  bustCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  footLengthCm?: number | null;
  confirmData: boolean;
  acceptPrivacy: boolean;
  receivingEnabled?: boolean;
};

function mapRow(row: any): StreamerGiftProfile {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    cep: row.cep,
    street: row.street,
    number: row.number,
    complement: row.complement || undefined,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    shoeSize: row.shoe_size,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    clothingSize: row.clothing_size,
    bustCm: row.bust_cm,
    waistCm: row.waist_cm,
    hipCm: row.hip_cm,
    footLengthCm: row.foot_length_cm,
    confirmData: !!row.confirm_data,
    acceptPrivacy: !!row.accept_privacy,
    receivingEnabled: row.receiving_enabled !== false,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export async function fetchAddressByCep(cep: string): Promise<{
  street: string;
  neighborhood: string;
  city: string;
  state: string;
} | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!res.ok) throw new Error('Não foi possível consultar o CEP.');
  const data = await res.json();
  if (data?.erro) return null;
  return {
    street: data.logradouro || '',
    neighborhood: data.bairro || '',
    city: data.localidade || '',
    state: data.uf || '',
  };
}

function toPayload(input: GiftProfileInput, userId: string) {
  return {
    user_id: userId,
    full_name: input.fullName.trim(),
    phone: onlyDigits(input.phone),
    cep: onlyDigits(input.cep),
    street: input.street.trim(),
    number: input.number.trim(),
    complement: input.complement?.trim() || null,
    neighborhood: input.neighborhood.trim(),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    shoe_size: String(input.shoeSize).trim(),
    height_cm: input.heightCm ?? null,
    weight_kg: input.weightKg ?? null,
    clothing_size: input.clothingSize || null,
    bust_cm: input.bustCm ?? null,
    waist_cm: input.waistCm ?? null,
    hip_cm: input.hipCm ?? null,
    foot_length_cm: input.footLengthCm ?? null,
    confirm_data: !!input.confirmData,
    accept_privacy: !!input.acceptPrivacy,
    receiving_enabled: input.receivingEnabled !== false,
  };
}

export const giftProfileService = {
  async getMine(): Promise<StreamerGiftProfile | null> {
    const user = auth.currentUser;
    if (!user) throw new Error('Faça login para continuar.');

    const { data, error } = await supabase
      .from('streamer_gift_profiles')
      .select('*')
      .eq('user_id', user.uid)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapRow(data) : null;
  },

  async save(input: GiftProfileInput): Promise<StreamerGiftProfile> {
    const user = auth.currentUser;
    if (!user) throw new Error('Faça login para continuar.');

    if (!input.confirmData || !input.acceptPrivacy) {
      throw new Error('Marque as confirmações obrigatórias para salvar.');
    }
    if (!input.fullName.trim() || !onlyDigits(input.phone) || onlyDigits(input.phone).length < 10) {
      throw new Error('Preencha nome completo e telefone/WhatsApp válidos.');
    }
    if (onlyDigits(input.cep).length !== 8) {
      throw new Error('CEP inválido.');
    }
    if (!input.street.trim() || !input.number.trim() || !input.neighborhood.trim() || !input.city.trim() || !input.state.trim()) {
      throw new Error('Preencha o endereço completo.');
    }
    if (!input.shoeSize) {
      throw new Error('Selecione o tamanho do calçado.');
    }

    const payload = toPayload(input, user.uid);
    const { data, error } = await supabase
      .from('streamer_gift_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapRow(data);
  },

  async setReceivingEnabled(enabled: boolean): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Faça login para continuar.');

    const { error } = await supabase
      .from('streamer_gift_profiles')
      .update({ receiving_enabled: enabled })
      .eq('user_id', user.uid);

    if (error) throw new Error(error.message);
  },

  async deleteMine(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Faça login para continuar.');

    const { error } = await supabase
      .from('streamer_gift_profiles')
      .delete()
      .eq('user_id', user.uid);

    if (error) throw new Error(error.message);
  },

  async acceptsRealGifts(streamerId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('streamer_accepts_real_gifts', {
      p_user_id: streamerId,
    });
    if (error) {
      console.warn('streamer_accepts_real_gifts:', error.message);
      return false;
    }
    return !!data;
  },
};

export const SHOE_SIZES = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
export const CLOTHING_SIZES: ClothingSize[] = ['P', 'M', 'G', 'GG', 'XG'];
