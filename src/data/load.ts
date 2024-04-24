import { readFileSync } from 'node:fs';
import Permission from '../model/permissionSchema';
import Role from '../model/roleSchema';
import User from '../model/userSchema';
import { genSaltSync, hashSync } from 'bcrypt';

export const loadData = async () => {
  const isEmptyPermissions = (await Permission.find({})).length === 0;
  if (isEmptyPermissions) {
    const permissionsJson = readFileSync(
      `${process.cwd()}/src/data/permissions.json`
    ).toString();
    const permissions = JSON.parse(permissionsJson);

    for (let p of permissions) {
      const permission = new Permission(p);
      await permission.save();
    }
  }

  const isEmptyRoles = (await Role.find({})).length === 0;
  if (isEmptyRoles) {
    const rolesJson = readFileSync(`${process.cwd()}/src/data/roles.json`).toString();
    const roles = JSON.parse(rolesJson);

    const foundPermissions = await Permission.find({});
    for (let r of roles) {
      if (r.name === 'admin') {
        const role = new Role(r);

        const p = foundPermissions.find((fp) => fp.name === 'admin');
        role.permissions.push(p?._id);

        await role.save();
      }

      if (r.name === 'comprador') {
        const role = new Role(r);

        let p = foundPermissions.find((fp) => fp.name === 'comentar');
        role.permissions.push(p?._id);
        p = foundPermissions.find((fp) => fp.name === 'valorar');
        role.permissions.push(p?._id);

        await role.save();
      }
    }
  }

  const isEmptyUsers = (await User.find({})).length === 0;
  if (isEmptyUsers) {
    const usersJson = readFileSync(`${process.cwd()}/src/data/users.json`).toString();
    const users = JSON.parse(usersJson);

    const foundRoles = await Role.find({});
    for (let u of users) {
      if (u.email === 'admin@email.com') {
        const salt = genSaltSync(10);
        const user = new User({ ...u, password: hashSync(u.password, salt) });

        const r = foundRoles.find((fr) => fr.name === 'admin');
        user.roles.push(r?._id);

        await user.save();
      }

      if (u.email === 'ucomprador@email.com') {
        const salt = genSaltSync(10);
        const user = new User({ ...u, password: hashSync(u.password, salt) });

        const r = foundRoles.find((fr) => fr.name === 'comprador');
        user.roles.push(r?._id);

        await user.save();
      }
    }
  }
};
