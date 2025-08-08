import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NpcProfileService } from '../../src/lib/services/npc-profile.service';

type SupabaseQueryResult<TData = any> = {
  data?: TData;
  error?: { message: string; code?: string } | null;
  count?: number | null;
};

function createQueryBuilder<TData = any>(config: {
  single?: SupabaseQueryResult<TData>;
  list?: SupabaseQueryResult<TData>;
  recordCalls?: { method: string; args: any[] }[];
}) {
  const calls = config.recordCalls ?? [];
  const builder: any = {
    __calls: calls,
    insert: vi.fn(function (this: any, payload: any) {
      calls.push({ method: 'insert', args: [payload] });
      return this;
    }),
    select: vi.fn(function (this: any, sel?: any, options?: any) {
      calls.push({ method: 'select', args: [sel, options] });
      return this;
    }),
    update: vi.fn(function (this: any, payload: any) {
      calls.push({ method: 'update', args: [payload] });
      return this;
    }),
    delete: vi.fn(function (this: any) {
      calls.push({ method: 'delete', args: [] });
      return this;
    }),
    eq: vi.fn(function (this: any, field: string, value: any) {
      calls.push({ method: 'eq', args: [field, value] });
      return this;
    }),
    or: vi.fn(function (this: any, expression: string) {
      calls.push({ method: 'or', args: [expression] });
      return this;
    }),
    order: vi.fn(function (this: any, field: string, opts?: any) {
      calls.push({ method: 'order', args: [field, opts] });
      return this;
    }),
    range: vi.fn(function (this: any, from: number, to: number) {
      calls.push({ method: 'range', args: [from, to] });
      return this;
    }),
    single: vi.fn(async function () {
      return config.single ?? { data: undefined, error: null };
    }),
    then: function (onFulfilled: any) {
      const value = config.list ?? { data: undefined, error: null, count: null };
      return onFulfilled(value);
    }
  };
  return builder;
}

function createSupabaseMock(tableBuilders: Record<string, any[]>) {
  const from = vi.fn((table: string) => {
    const queue = tableBuilders[table];
    if (!queue || queue.length === 0) {
      throw new Error(`No builder configured for table: ${table}`);
    }
    return queue.shift();
  });
  return { from } as any;
}

function createLogServiceMock({ shouldThrow } = { shouldThrow: false }) {
  return {
    logOperation: shouldThrow ? vi.fn(async () => { throw new Error('log failed'); }) : vi.fn(async () => {})
  } as any;
}

const validUuid = '123e4567-e89b-12d3-a456-426614174000';

describe('NpcProfileService', () => {
  const originalWarn = console.warn;
  const originalLog = console.log;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    console.warn = originalWarn;
    console.log = originalLog;
  });

  it('createProfile: succeeds even if logging fails (best-effort) and returns DTO', async () => {
    const profileRow = {
      id: validUuid,
      user_id: validUuid,
      name: 'John',
      appearance: 'Tall',
      profession: 'Baker',
      relationship_to_party: 'Friendly',
      scene_description: 'At the market',
      special_traits: 'Scar',
      complexity_level: 'zwykły',
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const calls: any[] = [];
    const npcProfilesBuilder = createQueryBuilder({
      single: { data: profileRow, error: null },
      recordCalls: calls
    });
    const supabase = createSupabaseMock({ npc_profiles: [npcProfilesBuilder] });
    const logService = createLogServiceMock({ shouldThrow: true });
    const service = new NpcProfileService(supabase, logService);

    const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const dto = await service.createProfile(
      {
        name: profileRow.name,
        appearance: profileRow.appearance,
        profession: profileRow.profession,
        relationship_to_party: profileRow.relationship_to_party,
        scene_description: profileRow.scene_description,
        special_traits: profileRow.special_traits,
        complexity_level: profileRow.complexity_level as any,
        is_public: profileRow.is_public
      },
      profileRow.user_id
    );

    expect(dto).toEqual(profileRow);
    expect(logService.logOperation).toHaveBeenCalledTimes(1);
    expect(spyWarn).toHaveBeenCalled();
    // Ensure insert/select flow was performed
    expect(calls.find(c => c.method === 'insert')).toBeTruthy();
    expect(calls.find(c => c.method === 'select')).toBeTruthy();
  });

  it('getProfileById: denies access to private profile for non-owner', async () => {
    const privateProfile = {
      id: validUuid,
      user_id: validUuid,
      name: 'Jane',
      appearance: 'Short',
      profession: 'Guard',
      relationship_to_party: 'Neutral',
      scene_description: 'At the gate',
      special_traits: 'Tattoo',
      complexity_level: 'zwykły',
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const builder = createQueryBuilder({ single: { data: privateProfile, error: null } });
    const supabase = createSupabaseMock({ npc_profiles: [builder] });
    const logService = createLogServiceMock();
    const service = new NpcProfileService(supabase, logService);

    await expect(service.getProfileById(privateProfile.id, '00000000-0000-0000-0000-000000000000'))
      .rejects.toThrow('Access denied - profile is private');
    expect(logService.logOperation).not.toHaveBeenCalled();
  });

  it('getProfileById: logs OPEN for owner (best-effort)', async () => {
    const profile = {
      id: validUuid,
      user_id: validUuid,
      name: 'Jane',
      appearance: 'Short',
      profession: 'Guard',
      relationship_to_party: 'Neutral',
      scene_description: 'At the gate',
      special_traits: 'Tattoo',
      complexity_level: 'zwykły',
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const builder = createQueryBuilder({ single: { data: profile, error: null } });
    const supabase = createSupabaseMock({ npc_profiles: [builder] });
    const logService = createLogServiceMock();
    const service = new NpcProfileService(supabase, logService);

    const result = await service.getProfileById(profile.id, profile.user_id);
    expect(result).toEqual(profile);
    expect(logService.logOperation).toHaveBeenCalledWith('OPEN', profile.id, profile.user_id, expect.any(Number));
  });

  it('updateProfile: enforces ownership and updates, logging best-effort', async () => {
    const existing = {
      id: validUuid,
      user_id: validUuid,
      name: 'Old',
      appearance: 'Old',
      profession: 'Old',
      relationship_to_party: 'Old',
      scene_description: 'Old',
      special_traits: 'Old',
      complexity_level: 'zwykły',
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const updated = { ...existing, name: 'New' };

    const calls: any[] = [];
    const fetchBuilder = createQueryBuilder({ single: { data: existing, error: null }, recordCalls: calls });
    const updateBuilder = createQueryBuilder({ single: { data: updated, error: null }, recordCalls: calls });
    const supabase = createSupabaseMock({ npc_profiles: [fetchBuilder, updateBuilder] });
    const logService = createLogServiceMock({ shouldThrow: true });
    const service = new NpcProfileService(supabase, logService);

    const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await service.updateProfile(existing.id, { name: 'New' } as any, existing.user_id);
    expect(result.name).toBe('New');
    expect(logService.logOperation).toHaveBeenCalled();
    expect(spyWarn).toHaveBeenCalled();
    // Ensure update flow was called
    expect(calls.find(c => c.method === 'update')).toBeTruthy();
  });

  it('updateProfile: denies update for non-owner', async () => {
    const existing = { id: validUuid, user_id: validUuid } as any;
    const fetchBuilder = createQueryBuilder({ single: { data: existing, error: null } });
    const supabase = createSupabaseMock({ npc_profiles: [fetchBuilder] });
    const logService = createLogServiceMock();
    const service = new NpcProfileService(supabase, logService);

    await expect(service.updateProfile(existing.id, { name: 'X' } as any, '00000000-0000-0000-0000-000000000000'))
      .rejects.toThrow('User does not have permission to update this profile');
  });

  it('deleteProfile: checks ownership and deletes profile; does not delete logs explicitly', async () => {
    const userId = validUuid;
    const profileId = validUuid;
    const selectBuilder = createQueryBuilder({ single: { data: { user_id: userId }, error: null } });
    const deleteBuilder = createQueryBuilder({ single: { data: { id: profileId, user_id: userId }, error: null } });
    const supabase = createSupabaseMock({ npc_profiles: [selectBuilder, deleteBuilder] });
    const logService = createLogServiceMock();
    const service = new NpcProfileService(supabase, logService);

    const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});

    await service.deleteProfile(profileId, userId);

    // Ensure we never touched npc_profile_logs table (no explicit logs deletion)
    const fromCalls = (supabase.from as any).mock.calls.map((args: any[]) => args[0]);
    expect(fromCalls).toEqual(['npc_profiles', 'npc_profiles']);
    expect(spyLog).toHaveBeenCalled();
  });

  it('listProfiles: anonymous default returns public only, applies pagination and sorting and search', async () => {
    const calls: any[] = [];
    const listProfile = {
      id: validUuid,
      user_id: validUuid,
      name: 'Alpha',
      appearance: 'A',
      profession: 'B',
      relationship_to_party: 'C',
      scene_description: 'D',
      special_traits: 'E',
      complexity_level: 'zwykły',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const listBuilder = createQueryBuilder({
      list: { data: [listProfile], error: null, count: 1 },
      recordCalls: calls
    });
    const supabase = createSupabaseMock({ npc_profiles: [listBuilder] });
    const logService = createLogServiceMock();
    const service = new NpcProfileService(supabase, logService);

    const res = await service.listProfiles(
      { page: 1, limit: 10, sort: 'created_at desc', search: 'Alpha' } as any,
      null
    );

    expect(res.data.length).toBe(1);
    expect(res.pagination.total).toBe(1);
    // Check that permission filter for anon was applied
    expect(calls.some(c => c.method === 'eq' && c.args[0] === 'is_public' && c.args[1] === true)).toBe(true);
    // Check search applied
    expect(calls.some(c => c.method === 'or' && String(c.args[0]).includes('name.ilike.%Alpha%'))).toBe(true);
    // Check sort and range applied
    expect(calls.some(c => c.method === 'order' && c.args[0] === 'created_at')).toBe(true);
    expect(calls.some(c => c.method === 'range' && c.args[0] === 0 && c.args[1] === 9)).toBe(true);
  });
});


