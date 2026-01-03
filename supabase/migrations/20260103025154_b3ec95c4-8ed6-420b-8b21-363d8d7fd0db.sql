-- Adicionar políticas SELECT restritivas para todas as tabelas sensíveis

-- organizer_payment_info: apenas organizadores veem suas próprias informações
CREATE POLICY "Organizers can only view their own payment info"
ON public.organizer_payment_info
FOR SELECT
USING (auth.uid() = organizer_id);

-- credit_transactions: usuários só veem suas próprias transações
CREATE POLICY "Users can only view their own transactions"
ON public.credit_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- pix_payments: usuários só veem seus próprios pagamentos
CREATE POLICY "Users can only view their own payments"
ON public.pix_payments
FOR SELECT
USING (auth.uid() = user_id);

-- user_roles: usuários só veem seus próprios papéis
CREATE POLICY "Users can only view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);