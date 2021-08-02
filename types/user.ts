export type Stat = {
  win: number;
  lose: number;
};

export interface User {
  _id: OurId;
  name: string;
  displayName: string;
  email: string;
  profileUrl: string | null;
  password: string;
  stats5M: {
    president: Stat;
    friend: Stat;
    opposite: Stat;
    optionalStats: {
      run: number;
      backRun: number;
      nogi: number;
      nogiRun: number;
      nogiBackRun: number;
    };
  };
  stats6M: {
    president: Stat;
    friend: Stat;
    opposite: Stat;
    died: number;
    optionalStats: {
      run: number;
      backRun: number;
      nogi: number;
      nogiRun: number;
      nogiBackRun: number;
    };
  };
  activatedAt: OurDate;
  createdAt: OurDate;
  updatedAt: OurDate;
  approvedAt: OurDate | null;
}

export type UserInfo = Pick<User, '_id' | 'name' | 'displayName' | 'email' | 'profileUrl'>;

export {};
