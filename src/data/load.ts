import { readFileSync } from 'node:fs';
import Permission from '../model/permissionSchema';
import Role from '../model/roleSchema';
import User from '../model/userSchema';

export const loadData = async () => {
  const isEmpty = (await Permission.find({})).length === 0;
  if (isEmpty) {
    const permissionsJson = readFileSync(
      `${process.cwd()}/src/data/permissions.json`
    ).toString();
    const permissions = JSON.parse(permissionsJson);

    for (let p of permissions) {
      const permission = new Permission(p);
      await permission.save();
    }

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

    const usersJson = readFileSync(`${process.cwd()}/src/data/users.json`).toString();
    const users = JSON.parse(usersJson);

    const foundRoles = await Role.find({});
    for (let u of users) {
      if (u.email === 'admin@email.com') {
        const user = new User(u);

        const r = foundRoles.find((fr) => fr.name === 'admin');
        user.roles.push(r?._id);

        await user.save();
      }

      if (u.email === 'ucomprador@email.com') {
        const user = new User(u);

        const r = foundRoles.find((fr) => fr.name === 'comprador');
        user.roles.push(r?._id);

        await user.save();
      }
    }
  }
};
