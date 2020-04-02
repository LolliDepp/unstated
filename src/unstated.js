import React from 'react';

const StateContext = React.createContext({});

export class Container {
  state;
  _listeners = [];
  _nextState;

  setState(updater, callback) {
    return Promise.resolve().then(() => {
      if (typeof updater === 'function') {
        this.nextState = updater(this.state);
      } else {
        this.nextState = updater;
      }

      if (this.nextState == null) {
        if (callback) callback();
        return;
      }

      this.state = Object.assign(this.state, this.nextState);

      this._listeners.forEach(listener => listener());

      return Promise.all(promises).then(() => {
        if (callback) {
          return callback();
        }
      });
    });
  }

  subscribe(fn) {
    this._listeners.push(fn);
  }

  unsubscribe(fn) {
    const index = this._listeners.indexOf(fn);
    if (index >= 0) {
      this._listeners.splice(index, 1);
    }
  }
}

const DUMMY_STATE = {};
const DUMMY_ARRAY = [null];

export class Subscribe extends React.Component {
  state = {};
  instances = [];
  unmounted = false;

  componentWillUnmount() {
    this.unmounted = true;
    this._unsubscribe();
  }

  _unsubscribe() {
    this.instances.forEach(container => {
      container.unsubscribe(this.onUpdate);
    });
  }

  onUpdate = () => {
    return new Promise(resolve => {
      if (!this.unmounted) {
        this.setState(DUMMY_STATE, resolve);
      } else {
        resolve();
      }
    });
  };

  _createInstances(map, containers) {
    let index = 0;
    while (index < this.instances.length) {
      if (!containers.includes(this.instances[index])) {
        this.instances.splice(index, 1);
      } else {
        index += 1;
      }
    }

    if (map === null) {
      throw new Error(
        'You must wrap your <Subscribe> components with a <Provider>'
      );
    }

    containers.forEach(ContainerItem => {
      if (!this.instances.includes(ContainerItem)) {
        let instance;

        if (
          typeof ContainerItem === 'object' &&
          ContainerItem instanceof Container
        ) {
          instance = ContainerItem;
        } else {
          instance = map.get(ContainerItem);

          if (!instance) {
            instance = new ContainerItem();
            map.set(ContainerItem, instance);
          }
        }
        instance.subscribe(this.onUpdate);
        this.instances.push(instance);
      }
    });
    return this.instances;
  }

  _applyInstancesFromMapToChildren = map => {
    this.props.children.apply(null, this._createInstances(map, this.props.to));
  };

  render() {
    return (
      <StateContext.Consumer>
        {this._applyInstancesFromMapToChildren}
      </StateContext.Consumer>
    );
  }
}

export function Provider(props) {
  _renderConsumer = parentMap => {
    let childMap = new Map(parentMap);

    if (props.inject) {
      props.inject.forEach(instance => {
        childMap.set(instance.constructor, instance);
      });
    }

    return (
      <StateContext.Provider value={childMap}>
        {props.children}
      </StateContext.Provider>
    );
  };
  return <StateContext.Consumer>{this._renderConsumer}</StateContext.Consumer>;
}
