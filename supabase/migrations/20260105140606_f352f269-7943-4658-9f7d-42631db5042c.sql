-- Políticas para admins acessarem todas as transações de crédito
CREATE POLICY "Admins can view all transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para admins acessarem todos os torneios
CREATE POLICY "Admins can view all tournaments"
ON public.tournaments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para admins editarem qualquer torneio
CREATE POLICY "Admins can update any tournament"
ON public.tournaments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para admins deletarem qualquer torneio
CREATE POLICY "Admins can delete any tournament"
ON public.tournaments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para admins acessarem todos os mini torneios (já tem SELECT para todos)
-- Políticas para admins editarem qualquer mini torneio
CREATE POLICY "Admins can update any mini tournament"
ON public.mini_tournaments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para admins deletarem qualquer mini torneio
CREATE POLICY "Admins can delete any mini tournament"
ON public.mini_tournaments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para admins verem todos os créditos de usuários
CREATE POLICY "Admins can view all user credits"
ON public.user_credits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para admins verem todos os depósitos de prêmios
CREATE POLICY "Admins can view all prize deposits"
ON public.prize_deposits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para admins verem todos os pagamentos PIX
CREATE POLICY "Admins can view all pix payments"
ON public.pix_payments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para admins verem todas as distribuições de prêmios
CREATE POLICY "Admins can view all prize distributions"
ON public.prize_distributions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));