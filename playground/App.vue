<template>
  <div v-if="authenticated === false">
    <label for="uname"><b>Username</b></label>
    <input
      v-model="username"
      type="text"
      placeholder="Enter Username"
      name="uname"
      required
    />

    <label for="psw"><b>Password</b></label>
    <input
      v-model="password"
      type="password"
      placeholder="Enter Password"
      name="psw"
      required
    />
    <button @click="login" type="submit">Login</button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { User } from './store'

export default {
  data: () => ({
    username: '',
    password: ''
  }),
  async mounted() {
    if (this.authenticated) {
      const user = await User.find()
      console.log(user)
    }
  },
  methods: {
    async login() {
      const test = await this.$store.dispatch('auth/authenticate', {
        email: this.username,
        password: this.password,
        strategy: 'local'
      })
      console.log({ test })
    },
    loadData() {}
  },
  computed: {
    ...mapGetters(['auth/isAuthenticated', 'auth/user']),
    authenticated() {
      return !!this['auth/isAuthenticated']
    }
  }
}
</script>

<style></style>
