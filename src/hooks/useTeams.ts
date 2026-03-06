import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc,
  updateDoc,
  increment,
  runTransaction
} from "firebase/firestore";
import { Team, TeamMember, Profile } from "@/types";

export function useTeams(userId?: string) {
  const queryClient = useQueryClient();

  const userTeams = useQuery({
    queryKey: ["user-teams", userId],
    queryFn: async () => {
      if (!userId) return [];
      const q = query(
        collection(db, "team_members"),
        where("user_id", "==", userId)
      );
      const snapshot = await getDocs(q);
      const teamIds = snapshot.docs.map(doc => doc.data().team_id);
      
      if (teamIds.length === 0) return [];

      const teamsPromises = teamIds.map(async (id) => {
        const teamDoc = await getDoc(doc(db, "teams", id));
        return { id: teamDoc.id, ...teamDoc.data() } as Team;
      });

      return Promise.all(teamsPromises);
    },
    enabled: !!userId,
  });

  const createTeam = useMutation({
    mutationFn: async ({ name, captainId }: { name: string, captainId: string }) => {
      // Use a transaction to ensure atomic creation of team and first member
      const teamId = await runTransaction(db, async (transaction) => {
        const teamRef = doc(collection(db, "teams"));
        const memberRef = doc(collection(db, "team_members"));

        transaction.set(teamRef, {
          name,
          captain_id: captainId,
          members_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        transaction.set(memberRef, {
          team_id: teamRef.id,
          user_id: captainId,
          role: 'captain',
          joined_at: new Date().toISOString(),
        });

        return teamRef.id;
      });

      return teamId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-teams", userId] });
    },
  });

  const inviteMemberByEmail = useMutation({
    mutationFn: async ({ teamId, email }: { teamId: string, email: string }) => {
      // 1. Find profile by email
      const q = query(
        collection(db, "profiles"),
        where("email", "==", email.trim().toLowerCase())
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error("Usuário não encontrado. O jogador precisa ter uma conta na Revallo para ser convidado.");
      }

      const userDoc = snapshot.docs[0];
      const inviteeId = userDoc.id;

      // 2. Check if already a member
      const memberQ = query(
        collection(db, "team_members"),
        where("team_id", "==", teamId),
        where("user_id", "==", inviteeId)
      );
      const memberSnapshot = await getDocs(memberQ);
      if (!memberSnapshot.empty) {
        throw new Error("Usuário já faz parte desta equipe.");
      }

      // 3. Add to team_members
      await addDoc(collection(db, "team_members"), {
        team_id: teamId,
        user_id: inviteeId,
        role: 'member',
        joined_at: new Date().toISOString(),
      });

      // 4. Increment members_count
      const teamRef = doc(db, "teams", teamId);
      await updateDoc(teamRef, {
        members_count: increment(1),
        updated_at: new Date().toISOString(),
      });

      return inviteeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });

  return { userTeams, createTeam, inviteMemberByEmail };
}

export function useTeamDetails(teamId: string) {
  const queryClient = useQueryClient();

  const team = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const teamDoc = await getDoc(doc(db, "teams", teamId));
      if (!teamDoc.exists()) return null;
      return { id: teamDoc.id, ...teamDoc.data() } as Team;
    },
    enabled: !!teamId,
  });

  const members = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const q = query(
        collection(db, "team_members"),
        where("team_id", "==", teamId)
      );
      const snapshot = await getDocs(q);
      const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TeamMember);

      // Fetch profiles
      const membersWithProfiles = await Promise.all(
        membersData.map(async (m) => {
          const userDoc = await getDoc(doc(db, "profiles", m.user_id));
          return {
            ...m,
            user: userDoc.exists() ? ({ id: userDoc.id, ...userDoc.data() } as Profile) : undefined
          };
        })
      );

      return membersWithProfiles;
    },
    enabled: !!teamId,
  });

  return { team, members };
}
