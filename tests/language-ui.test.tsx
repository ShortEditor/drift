import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react';
import {Picker} from '../src/components/Picker';
const prefs={genre:0,mood:'',query:''};
afterEach(cleanup);
describe('language picker',()=>{
 it('lists All, Telugu and Hindi and marks the active one',()=>{render(<Picker value={prefs} genres={[]} onChange={()=>{}} onClose={()=>{}} language="telugu" onLanguageChange={()=>{}}/>);const group=screen.getByRole('group',{name:'Song language'});const names=within(group).getAllByRole('button').map(b=>b.textContent);expect(names).toEqual(['All languages','Telugu','Hindi']);expect(within(group).getByRole('button',{name:'Telugu'}).getAttribute('aria-pressed')).toBe('true');expect(within(group).getByRole('button',{name:'All languages'}).getAttribute('aria-pressed')).toBe('false');expect(screen.getByText(/Showing Telugu songs from top artists/)).toBeTruthy();});
 it('reports picks',()=>{const onLanguageChange=vi.fn();render(<Picker value={prefs} genres={[{id:132,name:'Pop'}]} onChange={()=>{}} onClose={()=>{}} language="all" onLanguageChange={onLanguageChange}/>);const group=screen.getByRole('group',{name:'Song language'});fireEvent.click(within(group).getByRole('button',{name:'Telugu'}));expect(onLanguageChange).toHaveBeenCalledWith('telugu');fireEvent.click(within(group).getByRole('button',{name:'Hindi'}));expect(onLanguageChange).toHaveBeenCalledWith('hindi');});
});
