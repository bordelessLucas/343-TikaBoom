import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { useSafePad } from '../../hooks/useSafePad';
import {
  giftProfileService,
  fetchAddressByCep,
  SHOE_SIZES,
  CLOTHING_SIZES,
  type GiftProfileInput,
} from '../../services/giftProfileService';
import type { ClothingSize } from '../../types/models';
import { styles } from './GiftProfile.styles';

const emptyForm: GiftProfileInput = {
  fullName: '',
  phone: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  shoeSize: '',
  heightCm: null,
  weightKg: null,
  clothingSize: null,
  bustCm: null,
  waistCm: null,
  hipCm: null,
  footLengthCm: null,
  confirmData: false,
  acceptPrivacy: false,
  receivingEnabled: true,
};

function formatCep(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function parseOptionalNumber(value: string): number | null {
  const t = value.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export const GiftProfile = () => {
  const { navigate } = useNavigation();
  const safe = useSafePad();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [form, setForm] = useState<GiftProfileInput>(emptyForm);
  const [cepLoading, setCepLoading] = useState(false);

  const setField = <K extends keyof GiftProfileInput>(key: K, value: GiftProfileInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const load = async () => {
    try {
      setLoading(true);
      const profile = await giftProfileService.getMine();
      if (profile) {
        setHasProfile(true);
        setEditing(false);
        setForm({
          fullName: profile.fullName,
          phone: formatPhone(profile.phone),
          cep: formatCep(profile.cep),
          street: profile.street,
          number: profile.number,
          complement: profile.complement || '',
          neighborhood: profile.neighborhood,
          city: profile.city,
          state: profile.state,
          shoeSize: profile.shoeSize,
          heightCm: profile.heightCm ?? null,
          weightKg: profile.weightKg ?? null,
          clothingSize: profile.clothingSize ?? null,
          bustCm: profile.bustCm ?? null,
          waistCm: profile.waistCm ?? null,
          hipCm: profile.hipCm ?? null,
          footLengthCm: profile.footLengthCm ?? null,
          confirmData: profile.confirmData,
          acceptPrivacy: profile.acceptPrivacy,
          receivingEnabled: profile.receivingEnabled,
        });
      } else {
        setHasProfile(false);
        setEditing(true);
        setForm(emptyForm);
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Não foi possível carregar seus dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const lookupCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return;
    try {
      setCepLoading(true);
      const addr = await fetchAddressByCep(digits);
      if (!addr) {
        Alert.alert('CEP', 'CEP não encontrado.');
        return;
      }
      setForm((prev) => ({
        ...prev,
        street: addr.street || prev.street,
        neighborhood: addr.neighborhood || prev.neighborhood,
        city: addr.city || prev.city,
        state: addr.state || prev.state,
      }));
    } catch (e: any) {
      Alert.alert('CEP', e.message || 'Falha ao buscar CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await giftProfileService.save(form);
      setHasProfile(true);
      setEditing(false);
      Alert.alert('Salvo', 'Dados de Presente Real atualizados.');
      await load();
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReceiving = () => {
    if (!hasProfile) {
      Alert.alert('Atenção', 'Salve seus dados antes de ativar/desativar o recebimento.');
      return;
    }
    const next = !form.receivingEnabled;
    Alert.alert(
      next ? 'Ativar Presentes Reais' : 'Desativar Presentes Reais',
      next
        ? 'Usuários poderão enviar Presentes Reais para você nas lives.'
        : 'Seus dados ficam salvos, mas ninguém poderá enviar Presentes Reais até reativar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: next ? 'Ativar' : 'Desativar',
          style: next ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await giftProfileService.setReceivingEnabled(next);
              setField('receivingEnabled', next);
            } catch (e: any) {
              Alert.alert('Erro', e.message || 'Não foi possível atualizar.');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Apagar todos os dados',
      'Isso remove endereço, telefone e medidas. Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              await giftProfileService.deleteMine();
              setHasProfile(false);
              setEditing(true);
              setForm(emptyForm);
              Alert.alert('Pronto', 'Todos os dados foram apagados.');
            } catch (e: any) {
              Alert.alert('Erro', e.message || 'Não foi possível apagar.');
            }
          },
        },
      ]
    );
  };

  const locked = hasProfile && !editing;

  if (loading) {
    return (
      <LinearGradient colors={['#28002b', '#1a1a2e', '#0a0a1a']} style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#C0F93C" size="large" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#28002b', '#1a1a2e', '#0a0a1a']} style={styles.container}>
      <View style={[styles.header, { paddingTop: safe.paddingTop }]}>
        <TouchableOpacity onPress={() => navigate('Settings')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Presente Real</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              📢 Os dados de endereço e medidas serão carregados automaticamente quando um usuário
              enviar um Presente Real na sua live. Você pode editar ou desativar o recebimento a
              qualquer momento. Os dados são guardados conforme a LGPD.
            </Text>
          </View>

          {hasProfile && (
            <View
              style={[
                styles.statusPill,
                form.receivingEnabled ? styles.statusOn : styles.statusOff,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  form.receivingEnabled ? styles.statusTextOn : styles.statusTextOff,
                ]}
              >
                {form.receivingEnabled
                  ? 'Recebimento de Presentes Reais ATIVO'
                  : 'Recebimento DESATIVADO'}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados do streamer</Text>
            <Text style={styles.label}>
              Nome completo <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={form.fullName}
              editable={!locked}
              onChangeText={(v) => setField('fullName', v)}
              placeholder="Nome para entrega"
              placeholderTextColor="#777"
            />
            <Text style={styles.label}>
              Telefone / WhatsApp <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              editable={!locked}
              onChangeText={(v) => setField('phone', formatPhone(v))}
              keyboardType="phone-pad"
              placeholder="(00) 00000-0000"
              placeholderTextColor="#777"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço completo</Text>
            <Text style={styles.label}>
              CEP <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={form.cep}
                editable={!locked}
                onChangeText={(v) => {
                  const formatted = formatCep(v);
                  setField('cep', formatted);
                  if (formatted.replace(/\D/g, '').length === 8) lookupCep(formatted);
                }}
                keyboardType="number-pad"
                placeholder="00000-000"
                placeholderTextColor="#777"
              />
              {cepLoading && (
                <ActivityIndicator color="#C0F93C" style={{ marginLeft: 8, marginBottom: 12 }} />
              )}
            </View>
            <Text style={[styles.label, { marginTop: 12 }]}>
              Rua / Avenida <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={form.street}
              editable={!locked}
              onChangeText={(v) => setField('street', v)}
              placeholderTextColor="#777"
              placeholder="Rua"
            />
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>
                  Número <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={form.number}
                  editable={!locked}
                  onChangeText={(v) => setField('number', v)}
                  placeholder="Nº"
                  placeholderTextColor="#777"
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Complemento</Text>
                <TextInput
                  style={styles.input}
                  value={form.complement}
                  editable={!locked}
                  onChangeText={(v) => setField('complement', v)}
                  placeholder="Apto, bloco…"
                  placeholderTextColor="#777"
                />
              </View>
            </View>
            <Text style={styles.label}>
              Bairro <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={form.neighborhood}
              editable={!locked}
              onChangeText={(v) => setField('neighborhood', v)}
              placeholderTextColor="#777"
              placeholder="Bairro"
            />
            <View style={styles.row}>
              <View style={[styles.rowItem, { flex: 2 }]}>
                <Text style={styles.label}>
                  Cidade <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={form.city}
                  editable={!locked}
                  onChangeText={(v) => setField('city', v)}
                  placeholderTextColor="#777"
                  placeholder="Cidade"
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>
                  UF <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={form.state}
                  editable={!locked}
                  onChangeText={(v) => setField('state', v.toUpperCase().slice(0, 2))}
                  autoCapitalize="characters"
                  maxLength={2}
                  placeholder="UF"
                  placeholderTextColor="#777"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medidas corporais</Text>
            <Text style={styles.label}>
              Tamanho do calçado <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chips}>
              {SHOE_SIZES.map((size) => {
                const active = form.shoeSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    disabled={locked}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setField('shoeSize', size)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{size}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Tamanho da roupa (opcional)</Text>
            <View style={styles.chips}>
              {CLOTHING_SIZES.map((size) => {
                const active = form.clothingSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    disabled={locked}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() =>
                      setField('clothingSize', (active ? null : size) as ClothingSize | null)
                    }
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{size}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Altura (cm)</Text>
                <TextInput
                  style={styles.input}
                  editable={!locked}
                  keyboardType="decimal-pad"
                  value={form.heightCm != null ? String(form.heightCm) : ''}
                  onChangeText={(v) => setField('heightCm', parseOptionalNumber(v))}
                  placeholder="ex: 170"
                  placeholderTextColor="#777"
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput
                  style={styles.input}
                  editable={!locked}
                  keyboardType="decimal-pad"
                  value={form.weightKg != null ? String(form.weightKg) : ''}
                  onChangeText={(v) => setField('weightKg', parseOptionalNumber(v))}
                  placeholder="ex: 70"
                  placeholderTextColor="#777"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Busto (cm)</Text>
                <TextInput
                  style={styles.input}
                  editable={!locked}
                  keyboardType="decimal-pad"
                  value={form.bustCm != null ? String(form.bustCm) : ''}
                  onChangeText={(v) => setField('bustCm', parseOptionalNumber(v))}
                  placeholderTextColor="#777"
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Cintura (cm)</Text>
                <TextInput
                  style={styles.input}
                  editable={!locked}
                  keyboardType="decimal-pad"
                  value={form.waistCm != null ? String(form.waistCm) : ''}
                  onChangeText={(v) => setField('waistCm', parseOptionalNumber(v))}
                  placeholderTextColor="#777"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Quadril (cm)</Text>
                <TextInput
                  style={styles.input}
                  editable={!locked}
                  keyboardType="decimal-pad"
                  value={form.hipCm != null ? String(form.hipCm) : ''}
                  onChangeText={(v) => setField('hipCm', parseOptionalNumber(v))}
                  placeholderTextColor="#777"
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Comp. do pé (cm)</Text>
                <TextInput
                  style={styles.input}
                  editable={!locked}
                  keyboardType="decimal-pad"
                  value={form.footLengthCm != null ? String(form.footLengthCm) : ''}
                  onChangeText={(v) => setField('footLengthCm', parseOptionalNumber(v))}
                  placeholderTextColor="#777"
                />
              </View>
            </View>
          </View>

          {(editing || !hasProfile) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Confirmações</Text>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setField('confirmData', !form.confirmData)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, form.confirmData && styles.checkboxOn]}>
                  {form.confirmData && <MaterialIcons name="check" size={16} color="#111" />}
                </View>
                <Text style={styles.checkText}>
                  Eu confirmo que todos os dados, endereço e medidas estão corretos para recebimento
                  dos Presentes Reais enviados por usuários da live.
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setField('acceptPrivacy', !form.acceptPrivacy)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, form.acceptPrivacy && styles.checkboxOn]}>
                  {form.acceptPrivacy && <MaterialIcons name="check" size={16} color="#111" />}
                </View>
                <Text style={styles.checkText}>
                  Concordo com a Política de Privacidade: esses dados serão usados SOMENTE para
                  entrega dos presentes reais e não serão compartilhados para outros fins.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {editing || !hasProfile ? (
            <TouchableOpacity
              style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.primaryBtnText}>Salvar Dados</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setEditing(true)}>
              <Text style={styles.primaryBtnText}>Editar Dados</Text>
            </TouchableOpacity>
          )}

          {hasProfile && (
            <>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleToggleReceiving}>
                <Text style={styles.secondaryBtnText}>
                  {form.receivingEnabled
                    ? 'Desativar recebimento de Presentes Reais'
                    : 'Ativar recebimento de Presentes Reais'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerBtn} onPress={handleDelete}>
                <Text style={styles.dangerBtnText}>Apagar todos os dados</Text>
              </TouchableOpacity>
            </>
          )}

          {editing && hasProfile && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setEditing(false);
                load();
              }}
            >
              <Text style={styles.secondaryBtnText}>Cancelar edição</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};
