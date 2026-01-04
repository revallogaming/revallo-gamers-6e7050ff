-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_payments;