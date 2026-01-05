import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserPixKey } from '@/hooks/useUserPixKey';
import { PixKeyType, PIX_KEY_TYPE_INFO } from '@/types';
import { Loader2, CheckCircle, Key } from 'lucide-react';

const pixKeySchema = z.object({
  pix_key_type: z.enum(['cpf', 'phone', 'email', 'random']),
  pix_key: z.string().min(1, 'Chave PIX é obrigatória'),
});

type PixKeyFormData = z.infer<typeof pixKeySchema>;

export function PixKeyForm() {
  const { pixKey, isLoading, savePixKey, hasPixKey } = useUserPixKey();
  const [selectedType, setSelectedType] = useState<PixKeyType>(pixKey?.pix_key_type || 'cpf');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PixKeyFormData>({
    resolver: zodResolver(pixKeySchema),
    defaultValues: {
      pix_key_type: pixKey?.pix_key_type || 'cpf',
      pix_key: pixKey?.pix_key || '',
    },
  });

  const currentType = watch('pix_key_type');

  const onSubmit = (data: PixKeyFormData) => {
    savePixKey.mutate({
      pixKeyType: data.pix_key_type,
      pixKey: data.pix_key,
    });
  };

  const handleTypeChange = (value: PixKeyType) => {
    setSelectedType(value);
    setValue('pix_key_type', value);
    setValue('pix_key', '');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Chave PIX
        </CardTitle>
        <CardDescription>
          {hasPixKey 
            ? 'Sua chave PIX está cadastrada para receber premiações.'
            : 'Cadastre sua chave PIX para receber premiações de mini torneios.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Chave</Label>
            <Select value={currentType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PIX_KEY_TYPE_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Chave PIX</Label>
            <Input
              {...register('pix_key')}
              placeholder={PIX_KEY_TYPE_INFO[selectedType].placeholder}
            />
            {errors.pix_key && (
              <p className="text-sm text-destructive">{errors.pix_key.message}</p>
            )}
          </div>

          {hasPixKey && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Chave cadastrada: {pixKey?.pix_key}</span>
            </div>
          )}

          <Button type="submit" disabled={savePixKey.isPending} className="w-full">
            {savePixKey.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasPixKey ? 'Atualizar Chave PIX' : 'Cadastrar Chave PIX'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
